#!/bin/bash

# Script para LIMPIAR COMPLETAMENTE todo Docker del MVP Proxy Scraper
# Uso: ./scripts/docker-clean-all.sh [--force]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
FORCE="false"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE="true"
            shift
            ;;
        -h|--help)
            echo "Uso: $0 [--force]"
            echo "  --force  No pedir confirmación antes de limpiar"
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            exit 1
            ;;
    esac
done

echo -e "${RED}🧹 MVP Proxy Scraper - LIMPIEZA COMPLETA DE DOCKER${NC}"
echo -e "${RED}═══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⚠️  ADVERTENCIA: Este script eliminará:${NC}"
echo -e "   • Todos los contenedores del proyecto (local y AWS)"
echo -e "   • Todas las imágenes del proyecto"
echo -e "   • Todos los volúmenes del proyecto"
echo -e "   • Todas las redes del proyecto"
echo -e "   • Imágenes Docker no utilizadas del sistema"
echo ""

# Ask for confirmation unless --force is used
if [[ "$FORCE" != "true" ]]; then
    read -p "¿Estás seguro de que quieres continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Operación cancelada${NC}"
        exit 0
    fi
fi

echo -e "${BLUE}🛑 Paso 1: Deteniendo todos los servicios del proyecto...${NC}"

# Stop all project services
echo -e "${BLUE}   Deteniendo servicios locales...${NC}"
docker compose -f docker-compose.local.yml down --remove-orphans --volumes 2>/dev/null || true

echo -e "${BLUE}   Deteniendo servicios AWS...${NC}"
docker compose -f docker-compose.aws.yml down --remove-orphans --volumes 2>/dev/null || true

echo -e "${BLUE}   Deteniendo servicios legacy...${NC}"
docker compose down --remove-orphans --volumes 2>/dev/null || true

echo -e "${BLUE}🗑️  Paso 2: Eliminando contenedores específicos del proyecto...${NC}"

# Remove specific project containers
CONTAINERS=(
    "proxy-scraper-backend-local"
    "proxy-scraper-frontend-local"
    "proxy-scraper-backend-aws"
    "proxy-scraper-frontend-aws"
    "proxy-scraper-backend"
    "proxy-scraper-frontend"
)

for container in "${CONTAINERS[@]}"; do
    if docker ps -a --format "table {{.Names}}" | grep -q "^${container}$"; then
        echo -e "${BLUE}   Eliminando contenedor: ${container}${NC}"
        docker rm -f "$container" 2>/dev/null || true
    fi
done

echo -e "${BLUE}🖼️  Paso 3: Eliminando imágenes del proyecto...${NC}"

# Remove project images
PROJECT_IMAGES=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep -E "(scraper-proxies|proxy-scraper)" || true)
if [[ -n "$PROJECT_IMAGES" ]]; then
    echo "$PROJECT_IMAGES" | while read -r image; do
        if [[ "$image" != "REPOSITORY:TAG" ]]; then
            echo -e "${BLUE}   Eliminando imagen: ${image}${NC}"
            docker rmi -f "$image" 2>/dev/null || true
        fi
    done
else
    echo -e "${YELLOW}   No se encontraron imágenes específicas del proyecto${NC}"
fi

echo -e "${BLUE}📦 Paso 4: Eliminando volúmenes del proyecto...${NC}"

# Remove project volumes
PROJECT_VOLUMES=$(docker volume ls --format "table {{.Name}}" | grep -E "(scraper-proxies|proxy-scraper)" || true)
if [[ -n "$PROJECT_VOLUMES" ]]; then
    echo "$PROJECT_VOLUMES" | while read -r volume; do
        if [[ "$volume" != "VOLUME" ]]; then
            echo -e "${BLUE}   Eliminando volumen: ${volume}${NC}"
            docker volume rm -f "$volume" 2>/dev/null || true
        fi
    done
else
    echo -e "${YELLOW}   No se encontraron volúmenes específicos del proyecto${NC}"
fi

echo -e "${BLUE}🌐 Paso 5: Eliminando redes del proyecto...${NC}"

# Remove project networks
PROJECT_NETWORKS=$(docker network ls --format "table {{.Name}}" | grep -E "(scraper-proxies|proxy-scraper)" || true)
if [[ -n "$PROJECT_NETWORKS" ]]; then
    echo "$PROJECT_NETWORKS" | while read -r network; do
        if [[ "$network" != "NAME" && "$network" != "bridge" && "$network" != "host" && "$network" != "none" ]]; then
            echo -e "${BLUE}   Eliminando red: ${network}${NC}"
            docker network rm "$network" 2>/dev/null || true
        fi
    done
else
    echo -e "${YELLOW}   No se encontraron redes específicas del proyecto${NC}"
fi

echo -e "${BLUE}🧹 Paso 6: Limpieza general del sistema Docker...${NC}"

# General Docker cleanup
echo -e "${BLUE}   Eliminando contenedores parados...${NC}"
docker container prune -f 2>/dev/null || true

echo -e "${BLUE}   Eliminando imágenes no utilizadas...${NC}"
docker image prune -a -f 2>/dev/null || true

echo -e "${BLUE}   Eliminando volúmenes no utilizados...${NC}"
docker volume prune -f 2>/dev/null || true

echo -e "${BLUE}   Eliminando redes no utilizadas...${NC}"
docker network prune -f 2>/dev/null || true

echo -e "${BLUE}   Eliminando cache de build...${NC}"
docker builder prune -a -f 2>/dev/null || true

echo -e "${GREEN}✅ LIMPIEZA COMPLETA FINALIZADA${NC}"
echo ""
echo -e "${BLUE}📊 Estado final del sistema Docker:${NC}"
echo -e "${BLUE}   Contenedores activos:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "   Ninguno"

echo -e "${BLUE}   Imágenes disponibles:${NC}"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null | head -5 || echo "   Ninguna"

echo -e "${BLUE}   Volúmenes disponibles:${NC}"
docker volume ls --format "table {{.Name}}" 2>/dev/null | head -5 || echo "   Ninguno"

echo ""
echo -e "${GREEN}🎉 El sistema Docker ha sido limpiado completamente${NC}"
echo -e "${YELLOW}💡 Para volver a deployar:${NC}"
echo -e "   Local: ${GREEN}./scripts/docker-deploy-local.sh --build${NC}"
echo -e "   AWS:   ${GREEN}./scripts/docker-deploy-aws.sh --build${NC}" 