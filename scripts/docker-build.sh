#!/bin/bash

# Script de Build Automatizado para MVP Proxy Scraper
# Uso: ./scripts/docker-build.sh [--prod|--dev] [--no-cache]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BUILD_MODE="production"
NO_CACHE=""
VERBOSE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --verbose)
            VERBOSE="--progress=plain"
            shift
            ;;
        -h|--help)
            echo "Uso: $0 [--no-cache] [--verbose]"
            echo "  --no-cache No usar cache de Docker"
            echo "  --verbose  Output detallado"
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            echo "Usa --help para ver opciones disponibles"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🐳 MVP Proxy Scraper - Docker Build Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Verify Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker no está ejecutándose${NC}"
    exit 1
fi

# Show build info
echo -e "${YELLOW}📋 Configuración de Build:${NC}"
echo -e "   Modo: ${BUILD_MODE}"
echo -e "   Cache: $([ -n "$NO_CACHE" ] && echo "Deshabilitado" || echo "Habilitado")"
echo -e "   Directorio: $(pwd)"
echo ""

# Build function
build_service() {
    local service=$1
    local dockerfile=$2
    local context=$3
    
    echo -e "${BLUE}🔨 Building ${service}...${NC}"
    
    local build_cmd="docker build ${NO_CACHE} ${VERBOSE} -t proxy-scraper-${service}:latest --target production"
    
    build_cmd="${build_cmd} -f ${dockerfile} ${context}"
    
    echo -e "${YELLOW}Ejecutando: ${build_cmd}${NC}"
    
    if eval $build_cmd; then
        echo -e "${GREEN}✅ ${service} built successfully${NC}"
        
        # Show image size
        local size=$(docker images --format "table {{.Size}}" proxy-scraper-${service}:latest | tail -n 1)
        echo -e "   📦 Tamaño: ${size}"
        echo ""
    else
        echo -e "${RED}❌ Failed to build ${service}${NC}"
        exit 1
    fi
}

# Start build process
echo -e "${BLUE}🚀 Iniciando build process...${NC}"
start_time=$(date +%s)

# Build backend
build_service "backend" "Dockerfile" "."

# Build frontend
build_service "frontend" "apps/frontend/Dockerfile" "."

# Calculate build time
end_time=$(date +%s)
duration=$((end_time - start_time))

echo -e "${GREEN}🎉 Build completado exitosamente!${NC}"
echo -e "${GREEN}⏱️  Tiempo total: ${duration}s${NC}"
echo ""

# Show all images
echo -e "${BLUE}📋 Imágenes creadas:${NC}"
docker images | grep proxy-scraper

echo ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo -e "   🐳 Ejecutar stack completo: ${GREEN}docker compose up -d${NC}"
echo -e "   📊 Ver logs: ${GREEN}docker compose logs -f${NC}"
echo -e "   🔍 Estado: ${GREEN}docker compose ps${NC}"
echo -e "   🧹 Limpiar: ${GREEN}./scripts/docker-cleanup.sh${NC}" 