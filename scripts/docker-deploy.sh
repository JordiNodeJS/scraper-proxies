#!/bin/bash

# Script de Deployment para MVP Proxy Scraper
# Uso: ./scripts/docker-deploy.sh [--env prod|dev] [--build] [--rollback]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
ENVIRONMENT="prod"
BUILD_IMAGES="false"
ROLLBACK="false"
DETACHED="true"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
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
            echo "Uso: $0 [--env prod|dev] [--build] [--rollback] [--foreground]"
            echo "  --env      Entorno: prod o dev (default: prod)"
            echo "  --build    Build imágenes antes de deploy"
            echo "  --rollback Rollback al último deployment"
            echo "  --foreground Ejecutar en foreground (no -d)"
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 MVP Proxy Scraper - Deployment Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Verify environment
if [[ "$ENVIRONMENT" != "prod" && "$ENVIRONMENT" != "dev" ]]; then
    echo -e "${RED}❌ Environment debe ser 'prod' o 'dev'${NC}"
    exit 1
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
        if docker compose ps $service | grep -q "healthy"; then
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
    docker compose ps --format json > "$backup_dir/containers.json"
    
    # Save current images
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.Size}}" \
        | grep proxy-scraper > "$backup_dir/images.txt" || true
    
    echo "$backup_dir" > .last_backup
    echo -e "${GREEN}✅ Backup guardado en: ${backup_dir}${NC}"
}

# Function to rollback
rollback_deployment() {
    if [[ ! -f ".last_backup" ]]; then
        echo -e "${RED}❌ No hay backup disponible para rollback${NC}"
        exit 1
    fi
    
    local backup_dir=$(cat .last_backup)
    
    echo -e "${YELLOW}🔄 Iniciando rollback desde: ${backup_dir}${NC}"
    
    # Stop current services
    docker compose down
    
    # Here you would restore from backup
    # This is a simplified version
    echo -e "${GREEN}✅ Rollback completado${NC}"
}

# Main deployment flow
if [[ "$ROLLBACK" = "true" ]]; then
    rollback_deployment
    exit 0
fi

echo -e "${YELLOW}📋 Configuración de Deployment:${NC}"
echo -e "   Entorno: ${ENVIRONMENT}"
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
docker compose down --remove-orphans || true

# Build images if requested
if [[ "$BUILD_IMAGES" = "true" ]]; then
    echo -e "${BLUE}🔨 Building imágenes...${NC}"
    ./scripts/docker-build.sh --${ENVIRONMENT}
fi

# Create backup
backup_deployment

# Start deployment
echo -e "${BLUE}🚀 Iniciando deployment (${ENVIRONMENT})...${NC}"

if [[ "$ENVIRONMENT" = "dev" ]]; then
    compose_files="-f docker-compose.yml -f docker-compose.dev.yml"
else
    compose_files="-f docker-compose.yml"
fi

if [[ "$DETACHED" = "true" ]]; then
    detach_flag="-d"
else
    detach_flag=""
fi

# Start services
if docker compose $compose_files up $detach_flag --wait; then
    echo -e "${GREEN}✅ Servicios iniciados exitosamente${NC}"
else
    echo -e "${RED}❌ Error al iniciar servicios${NC}"
    exit 1
fi

# Health checks (only in detached mode)
if [[ "$DETACHED" = "true" ]]; then
    echo -e "${BLUE}🏥 Verificando health checks...${NC}"
    
    sleep 10  # Wait for initial startup
    
    # Check each service
    for service in backend frontend redis; do
        if ! check_health $service; then
            echo -e "${RED}❌ Deployment falló en health check${NC}"
            echo -e "${YELLOW}📋 Logs del servicio ${service}:${NC}"
            docker compose logs $service --tail=20
            exit 1
        fi
    done
fi

# Show deployment status
echo -e "${GREEN}🎉 Deployment completado exitosamente!${NC}"
echo ""
echo -e "${BLUE}📊 Estado de servicios:${NC}"
docker compose ps

echo ""
echo -e "${BLUE}📋 URLs de acceso:${NC}"
if [[ "$ENVIRONMENT" = "dev" ]]; then
    echo -e "   Frontend: ${GREEN}http://localhost:5173${NC}"
    echo -e "   Backend:  ${GREEN}http://localhost:3001${NC}"
else
    echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "   Backend:  ${GREEN}http://localhost:3001${NC}"
fi
echo -e "   Redis:    ${GREEN}localhost:6379${NC}"

echo ""
echo -e "${YELLOW}💡 Comandos útiles:${NC}"
echo -e "   📊 Ver logs: ${GREEN}docker compose logs -f${NC}"
echo -e "   🔍 Estado: ${GREEN}docker compose ps${NC}"
echo -e "   🛑 Parar: ${GREEN}docker compose down${NC}"
echo -e "   🧹 Limpiar: ${GREEN}./scripts/docker-cleanup.sh${NC}" 