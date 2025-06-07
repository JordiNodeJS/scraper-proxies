#!/bin/bash

# Script de Deployment AWS para MVP Proxy Scraper
# Uso: ./scripts/docker-deploy-aws.sh [--build] [--clean] [--ip IP_ADDRESS]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
BUILD_IMAGES="false"
CLEAN="false"
AWS_IP=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD_IMAGES="true"
            shift
            ;;
        --clean)
            CLEAN="true"
            shift
            ;;
        --ip)
            AWS_IP="$2"
            shift 2
            ;;
        -h|--help)
            echo "Uso: $0 [--build] [--clean] [--ip IP_ADDRESS]"
            echo "  --build  Build imágenes antes de deploy"
            echo "  --clean  Limpiar contenedores e imágenes anteriores"
            echo "  --ip     IP pública del servidor AWS (auto-detecta si no se especifica)"
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            exit 1
            ;;
    esac
done

# Auto-detect AWS IP if not provided
if [[ -z "$AWS_IP" ]]; then
    echo -e "${BLUE}🔍 Auto-detectando IP pública...${NC}"
    AWS_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "")
    if [[ -z "$AWS_IP" ]]; then
        echo -e "${RED}❌ No se pudo detectar la IP pública automáticamente${NC}"
        echo -e "${YELLOW}💡 Usa: $0 --ip TU_IP_PUBLICA${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}🚀 MVP Proxy Scraper - Deployment AWS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 Configuración:${NC}"
echo -e "   Entorno: AWS PRODUCTION"
echo -e "   IP Pública: ${AWS_IP}"
echo -e "   Build: ${BUILD_IMAGES}"
echo -e "   Clean: ${CLEAN}"
echo -e "   Puertos: Frontend 3080, Backend 3081"
echo ""

# Update docker-compose.aws.yml with current IP
echo -e "${BLUE}🔧 Actualizando configuración con IP actual...${NC}"
sed -i "s|CORS_ORIGIN=http://[0-9.]*:3080|CORS_ORIGIN=http://${AWS_IP}:3080|g" docker-compose.aws.yml
sed -i "s|VITE_API_URL=http://[0-9.]*:3081|VITE_API_URL=http://${AWS_IP}:3081|g" docker-compose.aws.yml

# Clean if requested
if [[ "$CLEAN" = "true" ]]; then
    echo -e "${BLUE}🧹 Limpiando contenedores e imágenes anteriores...${NC}"
    docker compose -f docker-compose.aws.yml down --remove-orphans || true
    docker system prune -f || true
fi

# Stop existing services
echo -e "${BLUE}🛑 Deteniendo servicios existentes...${NC}"
docker compose -f docker-compose.aws.yml down || true

# Build images if requested
if [[ "$BUILD_IMAGES" = "true" ]]; then
    echo -e "${BLUE}🔨 Building imágenes para AWS...${NC}"
    docker compose -f docker-compose.aws.yml build --no-cache
fi

# Start deployment
echo -e "${BLUE}🚀 Iniciando deployment AWS...${NC}"

if docker compose -f docker-compose.aws.yml up -d --wait; then
    echo -e "${GREEN}✅ Servicios iniciados exitosamente${NC}"
else
    echo -e "${RED}❌ Error al iniciar servicios${NC}"
    exit 1
fi

# Wait for services to be ready
echo -e "${BLUE}⏳ Esperando que los servicios estén listos...${NC}"
sleep 20

# Show deployment status
echo -e "${GREEN}🎉 Deployment AWS completado!${NC}"
echo ""
echo -e "${BLUE}📊 Estado de servicios:${NC}"
docker compose -f docker-compose.aws.yml ps

echo ""
echo -e "${BLUE}📋 URLs de acceso PÚBLICAS:${NC}"
echo -e "   Frontend: ${GREEN}http://${AWS_IP}:3080${NC}"
echo -e "   Backend:  ${GREEN}http://${AWS_IP}:3081${NC}"

echo ""
echo -e "${YELLOW}💡 Comandos útiles:${NC}"
echo -e "   📊 Ver logs: ${GREEN}docker compose -f docker-compose.aws.yml logs -f${NC}"
echo -e "   🔍 Estado: ${GREEN}docker compose -f docker-compose.aws.yml ps${NC}"
echo -e "   🛑 Parar: ${GREEN}docker compose -f docker-compose.aws.yml down${NC}"

# Test connectivity
echo ""
echo -e "${BLUE}🧪 Testing conectividad...${NC}"
if curl -s http://localhost:3081/health > /dev/null; then
    echo -e "${GREEN}✅ Backend respondiendo localmente${NC}"
else
    echo -e "${YELLOW}⚠️  Backend aún no responde, puede necesitar más tiempo${NC}"
fi

echo ""
echo -e "${BLUE}🌐 Para acceder desde internet:${NC}"
echo -e "   Asegúrate de que los Security Groups permitan tráfico en puertos 3080 y 3081"
echo -e "   Frontend: ${GREEN}http://${AWS_IP}:3080${NC}" 