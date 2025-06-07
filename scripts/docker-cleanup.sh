#!/bin/bash

# Script de Cleanup para MVP Proxy Scraper
# Uso: ./scripts/docker-cleanup.sh [--all] [--volumes] [--force]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
CLEANUP_ALL="false"
CLEANUP_VOLUMES="false"
FORCE_CLEANUP="false"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            CLEANUP_ALL="true"
            shift
            ;;
        --volumes)
            CLEANUP_VOLUMES="true"
            shift
            ;;
        --force)
            FORCE_CLEANUP="true"
            shift
            ;;
        -h|--help)
            echo "Uso: $0 [--all] [--volumes] [--force]"
            echo "  --all      Limpieza completa (contenedores, imágenes, networks)"
            echo "  --volumes  Incluir volúmenes en la limpieza"
            echo "  --force    No solicitar confirmación"
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🧹 MVP Proxy Scraper - Docker Cleanup Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Function to ask for confirmation
confirm() {
    if [[ "$FORCE_CLEANUP" = "true" ]]; then
        return 0
    fi
    
    local message="$1"
    echo -e "${YELLOW}⚠️  ${message}${NC}"
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Operación cancelada${NC}"
        return 1
    fi
    return 0
}

# Function to show disk space
show_disk_usage() {
    echo -e "${BLUE}💾 Uso de espacio en disco:${NC}"
    
    # Docker system usage
    echo -e "${YELLOW}📊 Docker system df:${NC}"
    docker system df
    echo ""
    
    # Disk space
    echo -e "${YELLOW}💽 Espacio en disco disponible:${NC}"
    df -h . | head -2
    echo ""
}

# Function to cleanup containers
cleanup_containers() {
    echo -e "${BLUE}📦 Limpiando contenedores...${NC}"
    
    # Stop all proxy-scraper containers
    local containers=$(docker ps -a --filter "name=proxy-scraper" --format "{{.Names}}" | head -10)
    if [[ -n "$containers" ]]; then
        echo -e "${YELLOW}🛑 Deteniendo contenedores del proyecto...${NC}"
        echo "$containers" | xargs docker stop 2>/dev/null || true
        echo "$containers" | xargs docker rm 2>/dev/null || true
        echo -e "${GREEN}✅ Contenedores del proyecto eliminados${NC}"
    fi
    
    # Remove exited containers
    local exited=$(docker ps -a -q --filter "status=exited" | head -10)
    if [[ -n "$exited" ]]; then
        if confirm "Se eliminarán $(echo "$exited" | wc -l) contenedores con estado 'exited'"; then
            echo "$exited" | xargs docker rm
            echo -e "${GREEN}✅ Contenedores 'exited' eliminados${NC}"
        fi
    fi
}

# Function to cleanup images
cleanup_images() {
    echo -e "${BLUE}🖼️  Limpiando imágenes...${NC}"
    
    # Remove proxy-scraper images
    local project_images=$(docker images --filter "reference=proxy-scraper*" --format "{{.Repository}}:{{.Tag}}" | head -10)
    if [[ -n "$project_images" ]]; then
        if confirm "Se eliminarán las imágenes del proyecto proxy-scraper"; then
            echo "$project_images" | xargs docker rmi -f 2>/dev/null || true
            echo -e "${GREEN}✅ Imágenes del proyecto eliminadas${NC}"
        fi
    fi
    
    # Remove dangling images
    local dangling=$(docker images -q --filter "dangling=true" | head -20)
    if [[ -n "$dangling" ]]; then
        if confirm "Se eliminarán $(echo "$dangling" | wc -l) imágenes 'dangling'"; then
            echo "$dangling" | xargs docker rmi
            echo -e "${GREEN}✅ Imágenes 'dangling' eliminadas${NC}"
        fi
    fi
    
    # Remove unused images (if --all is specified)
    if [[ "$CLEANUP_ALL" = "true" ]]; then
        if confirm "Se eliminarán TODAS las imágenes no utilizadas"; then
            docker image prune -a -f
            echo -e "${GREEN}✅ Imágenes no utilizadas eliminadas${NC}"
        fi
    fi
}

# Function to cleanup volumes
cleanup_volumes() {
    echo -e "${BLUE}📚 Limpiando volúmenes...${NC}"
    
    # Remove project volumes
    local project_volumes=$(docker volume ls --filter "name=scraper-proxies" --format "{{.Name}}" | head -10)
    if [[ -n "$project_volumes" ]]; then
        if confirm "Se eliminarán los volúmenes del proyecto"; then
            echo "$project_volumes" | xargs docker volume rm 2>/dev/null || true
            echo -e "${GREEN}✅ Volúmenes del proyecto eliminados${NC}"
        fi
    fi
    
    # Remove unused volumes
    local unused_volumes=$(docker volume ls -q --filter "dangling=true" | head -10)
    if [[ -n "$unused_volumes" ]]; then
        if confirm "Se eliminarán $(echo "$unused_volumes" | wc -l) volúmenes no utilizados"; then
            echo "$unused_volumes" | xargs docker volume rm
            echo -e "${GREEN}✅ Volúmenes no utilizados eliminados${NC}"
        fi
    fi
}

# Function to cleanup networks
cleanup_networks() {
    echo -e "${BLUE}🌐 Limpiando networks...${NC}"
    
    # Remove project networks
    local project_networks=$(docker network ls --filter "name=proxy-scraper" --format "{{.Name}}" | head -5)
    if [[ -n "$project_networks" ]]; then
        if confirm "Se eliminarán las redes del proyecto"; then
            echo "$project_networks" | xargs docker network rm 2>/dev/null || true
            echo -e "${GREEN}✅ Redes del proyecto eliminadas${NC}"
        fi
    fi
    
    # Remove unused networks
    if confirm "Se eliminarán las redes no utilizadas"; then
        docker network prune -f
        echo -e "${GREEN}✅ Redes no utilizadas eliminadas${NC}"
    fi
}

# Function to cleanup build cache
cleanup_build_cache() {
    echo -e "${BLUE}🏗️  Limpiando build cache...${NC}"
    
    if confirm "Se eliminará el cache de build de Docker"; then
        docker builder prune -a -f
        echo -e "${GREEN}✅ Build cache eliminado${NC}"
    fi
}

# Show initial disk usage
echo -e "${YELLOW}📋 Estado inicial:${NC}"
show_disk_usage

# Stop docker-compose services first
echo -e "${BLUE}🛑 Deteniendo servicios de docker-compose...${NC}"
docker compose down --remove-orphans 2>/dev/null || true

# Main cleanup process
echo -e "${BLUE}🚀 Iniciando limpieza...${NC}"

# Always cleanup containers
cleanup_containers

# Always cleanup images
cleanup_images

# Cleanup volumes if requested
if [[ "$CLEANUP_VOLUMES" = "true" ]]; then
    cleanup_volumes
fi

# Cleanup networks and build cache if --all is specified
if [[ "$CLEANUP_ALL" = "true" ]]; then
    cleanup_networks
    cleanup_build_cache
fi

# Run Docker system prune
if [[ "$CLEANUP_ALL" = "true" ]]; then
    if confirm "Ejecutar 'docker system prune' para limpieza final"; then
        if [[ "$CLEANUP_VOLUMES" = "true" ]]; then
            docker system prune -a --volumes -f
        else
            docker system prune -a -f
        fi
        echo -e "${GREEN}✅ Sistema Docker limpiado completamente${NC}"
    fi
fi

# Show final disk usage
echo ""
echo -e "${YELLOW}📋 Estado final:${NC}"
show_disk_usage

# Summary
echo -e "${GREEN}🎉 Limpieza completada exitosamente!${NC}"
echo ""
echo -e "${YELLOW}💡 Comandos útiles:${NC}"
echo -e "   🔍 Ver imágenes: ${GREEN}docker images${NC}"
echo -e "   📦 Ver contenedores: ${GREEN}docker ps -a${NC}"
echo -e "   📚 Ver volúmenes: ${GREEN}docker volume ls${NC}"
echo -e "   🌐 Ver networks: ${GREEN}docker network ls${NC}"
echo -e "   📊 Uso del sistema: ${GREEN}docker system df${NC}" 