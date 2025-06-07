#!/bin/bash

# Script de Deployment LOCAL para MVP Proxy Scraper
# Uso: ./scripts/docker-deploy-local.sh [--build] [--clean]

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
        -h|--help)
            echo "Uso: $0 [--build] [--clean]"
            echo "  --build  Build imágenes antes de deploy"
            echo "  --clean  Limpiar contenedores e imágenes anteriores"
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 MVP Proxy Scraper - Deployment LOCAL${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 Configuración:${NC}"
echo -e "   Entorno: LOCAL"
echo -e "   Build: ${BUILD_IMAGES}"
echo -e "   Clean: ${CLEAN}"
echo -e "   Puertos: Frontend 3800, Backend 3801"
echo ""

# Clean if requested
if [[ "$CLEAN" = "true" ]]; then
    echo -e "${BLUE}🧹 Limpiando contenedores e imágenes anteriores...${NC}"
    docker compose -f docker-compose.local.yml down --remove-orphans || true
    docker system prune -f || true
fi

# Stop existing services
echo -e "${BLUE}🛑 Deteniendo servicios existentes...${NC}"
docker compose -f docker-compose.local.yml down || true

# Build images if requested
if [[ "$BUILD_IMAGES" = "true" ]]; then
    echo -e "${BLUE}🔨 Building imágenes para LOCAL...${NC}"
    docker compose -f docker-compose.local.yml build --no-cache
fi

# Start deployment
echo -e "${BLUE}🚀 Iniciando deployment LOCAL...${NC}"

if docker compose -f docker-compose.local.yml up -d --wait; then
    echo -e "${GREEN}✅ Servicios iniciados exitosamente${NC}"
else
    echo -e "${RED}❌ Error al iniciar servicios${NC}"
    exit 1
fi

# Wait for services to be ready
echo -e "${BLUE}⏳ Esperando que los servicios estén listos...${NC}"
sleep 15

# Show deployment status
echo -e "${GREEN}🎉 Deployment LOCAL completado!${NC}"
echo ""
echo -e "${BLUE}📊 Estado de servicios:${NC}"
docker compose -f docker-compose.local.yml ps

echo ""
echo -e "${BLUE}📋 URLs de acceso LOCAL:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3800${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:3801${NC}"

echo ""
echo -e "${YELLOW}💡 Comandos útiles:${NC}"
echo -e "   📊 Ver logs: ${GREEN}docker compose -f docker-compose.local.yml logs -f${NC}"
echo -e "   🔍 Estado: ${GREEN}docker compose -f docker-compose.local.yml ps${NC}"
echo -e "   🛑 Parar: ${GREEN}docker compose -f docker-compose.local.yml down${NC}"

# Test connectivity
echo ""
echo -e "${BLUE}🧪 Testing conectividad...${NC}"
if curl -s http://localhost:3801/health > /dev/null; then
    echo -e "${GREEN}✅ Backend respondiendo correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  Backend aún no responde, puede necesitar más tiempo${NC}"
fi 