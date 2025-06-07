#!/bin/bash

# Script de Deployment para MVP Proxy Scraper (Legacy Docker Compose)
# Uso: ./scripts/docker-deploy-legacy.sh [--build] [--rollback] [--foreground]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
BUILD_IMAGES="false"
ROLLBACK="false"
DETACHED="true"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD_IMAGES="true"
            shift
            ;;
        --rollback)
            ROLLBACK="true"
            shift
            ;;
        --foreground)
            DETACHED="false"
            shift
            ;;
        -h|--help)
            echo "Uso: $0 [--build] [--rollback] [--foreground]"
            echo "  --build      Build imágenes antes de deploy"
            echo "  --rollback   Rollback al último deployment"
            echo "  --foreground Ejecutar en foreground (no -d)"
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 MVP Proxy Scraper - Deployment Script (Legacy)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose no está instalado${NC}"
    echo -e "${YELLOW}💡 Instalando docker-compose...${NC}"
    
    # Install docker-compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo -e "${GREEN}✅ docker-compose instalado${NC}"
fi

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    echo -e "${YELLOW}⚠️  Archivo .env no existe, copiando desde .env.example${NC}"
    cp .env.example .env
fi

# Function to check service health
check_health() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}🔍 Verificando salud de ${service}...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps $service | grep -q "healthy\|Up"; then
            echo -e "${GREEN}✅ ${service} está healthy${NC}"
            return 0
        fi
        
        echo -e "   Intento ${attempt}/${max_attempts}..."
        sleep 5
        ((attempt++))
    done
    
    echo -e "${RED}❌ ${service} no pasó health check${NC}"
    return 1
}

# Function to backup current state
backup_deployment() {
    echo -e "${BLUE}💾 Creando backup del deployment actual...${NC}"
    
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Export current containers
    docker-compose ps > "$backup_dir/containers.txt" || true
    
    # Save current images
    docker images | grep proxy-scraper > "$backup_dir/images.txt" || true
    
    echo "$backup_dir" > .last_backup
    echo -e "${GREEN}✅ Backup guardado en: ${backup_dir}${NC}"
}

echo -e "${YELLOW}📋 Configuración de Deployment:${NC}"
echo -e "   Entorno: production"
echo -e "   Build: ${BUILD_IMAGES}"
echo -e "   Directorio: $(pwd)"
echo ""

# Pre-deployment checks
echo -e "${BLUE}🔍 Verificaciones pre-deployment...${NC}"

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker no está ejecutándose${NC}"
    exit 1
fi

# Check disk space
available_space=$(df . | awk 'NR==2 {print $4}')
if [[ $available_space -lt 1000000 ]]; then
    echo -e "${YELLOW}⚠️  Poco espacio en disco: ${available_space}KB${NC}"
fi

# Stop existing services
echo -e "${BLUE}🛑 Deteniendo servicios existentes...${NC}"
docker-compose down || true

# Build images if requested
if [[ "$BUILD_IMAGES" = "true" ]]; then
    echo -e "${BLUE}🔨 Building imágenes...${NC}"
    ./scripts/docker-build.sh
fi

# Create backup
backup_deployment

# Start deployment
echo -e "${BLUE}🚀 Iniciando deployment (production)...${NC}"

if [[ "$DETACHED" = "true" ]]; then
    detach_flag="-d"
else
    detach_flag=""
fi

# Start services
if docker-compose -f docker-compose.yml up $detach_flag; then
    echo -e "${GREEN}✅ Servicios iniciados exitosamente${NC}"
else
    echo -e "${RED}❌ Error al iniciar servicios${NC}"
    exit 1
fi

# Health checks (only in detached mode)
if [[ "$DETACHED" = "true" ]]; then
    echo -e "${BLUE}🏥 Verificando health checks...${NC}"
    
    sleep 15  # Wait for initial startup
    
    # Check each service
    for service in backend frontend; do
        if ! check_health $service; then
            echo -e "${RED}❌ Deployment falló en health check${NC}"
            echo -e "${YELLOW}📋 Logs del servicio ${service}:${NC}"
            docker-compose logs $service --tail=20
            exit 1
        fi
    done
fi

# Show deployment status
echo -e "${GREEN}🎉 Deployment completado exitosamente!${NC}"
echo ""
echo -e "${BLUE}📊 Estado de servicios:${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}📋 URLs de acceso:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3800${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:3801${NC}"

echo ""
echo -e "${YELLOW}💡 Comandos útiles:${NC}"
echo -e "   📊 Ver logs: ${GREEN}docker-compose logs -f${NC}"
echo -e "   🔍 Estado: ${GREEN}docker-compose ps${NC}"
echo -e "   🛑 Parar: ${GREEN}docker-compose down${NC}"
echo -e "   🧹 Limpiar: ${GREEN}./scripts/docker-cleanup.sh${NC}" 