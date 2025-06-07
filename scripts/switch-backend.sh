#!/bin/bash

# Script para cambiar configuración del frontend entre backend nativo y Docker
# Uso: ./scripts/switch-backend.sh [native|docker]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to show help
show_help() {
    echo -e "${BLUE}🔄 Switch Backend Configuration${NC}"
    echo -e "${BLUE}═══════════════════════════════${NC}"
    echo ""
    echo "Uso: $0 [native|docker]"
    echo ""
    echo "Opciones:"
    echo "  native    Configurar frontend para backend nativo (puerto 3001)"
    echo "  docker    Configurar frontend para backend en Docker (puerto 3081)"
    echo ""
    echo "Ejemplos:"
    echo "  $0 native   # Frontend dev → Backend nativo"
    echo "  $0 docker   # Frontend dev → Backend Docker"
}

# Parse arguments
if [[ $# -eq 0 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    show_help
    exit 0
fi

MODE="$1"

if [[ "$MODE" != "native" && "$MODE" != "docker" ]]; then
    echo -e "${RED}❌ Modo inválido: $MODE${NC}"
    echo -e "${YELLOW}💡 Usa 'native' o 'docker'${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Cambiando configuración del frontend...${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# Check if frontend directory exists
if [[ ! -d "apps/frontend" ]]; then
    echo -e "${RED}❌ Directorio apps/frontend no encontrado${NC}"
    exit 1
fi

cd apps/frontend

# Backup current .env if exists
if [[ -f ".env" ]]; then
    echo -e "${YELLOW}💾 Creando backup de .env actual...${NC}"
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

if [[ "$MODE" == "native" ]]; then
    echo -e "${GREEN}🏠 Configurando para backend NATIVO (puerto 3001)...${NC}"
    
    # Create .env for native backend
    cat > .env << 'EOF'
# 🎨 Frontend Environment Variables - Backend Nativo
# Backend ejecutándose nativamente en puerto 3001

# 🔗 URL del Backend API
# En desarrollo, Vite proxy maneja '/api' automáticamente
# VITE_API_URL=http://localhost:3001

# 🔧 Puerto del Backend para Vite Proxy
# Backend nativo usa puerto 3001
VITE_BACKEND_PORT=3001

# 🌐 Configuración de la App
VITE_APP_NAME=Scraper Proxies MVP
VITE_APP_VERSION=1.0.0

# 🔧 Configuración de Desarrollo
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_LOGGING=true

# 📊 Configuración de Performance
VITE_QUERY_STALE_TIME=300000
VITE_QUERY_CACHE_TIME=600000

# 🔄 Configuración de Polling/Refresh
VITE_HEALTH_CHECK_INTERVAL=30000
VITE_AUTO_REFRESH_INTERVAL=60000
EOF

    echo -e "${GREEN}✅ Configurado para backend nativo${NC}"
    echo -e "${YELLOW}📋 URLs:${NC}"
    echo -e "   Frontend: ${GREEN}http://localhost:5173${NC}"
    echo -e "   Backend:  ${GREEN}http://localhost:3001${NC}"
    echo ""
    echo -e "${YELLOW}💡 Para iniciar:${NC}"
    echo -e "   ${GREEN}bun run dev${NC} (en directorio raíz)"
    echo -e "   O separadamente:"
    echo -e "   ${GREEN}cd apps/backend && bun run dev${NC}"
    echo -e "   ${GREEN}cd apps/frontend && bun run dev${NC}"

elif [[ "$MODE" == "docker" ]]; then
    echo -e "${BLUE}🐳 Configurando para backend en DOCKER (puerto 3081)...${NC}"
    
    # Copy .env.docker to .env
    if [[ -f ".env.docker" ]]; then
        cp .env.docker .env
        echo -e "${GREEN}✅ Configurado para backend en Docker${NC}"
    else
        # Create .env for Docker backend
        cat > .env << 'EOF'
# 🐳 Frontend Environment Variables - Backend en Docker
# Backend ejecutándose en Docker en puerto 3081

# 🔗 URL del Backend API
# Apunta al backend en Docker (puerto 3081)
VITE_API_URL=http://localhost:3081

# 🔧 Puerto del Backend para Vite Proxy
# Backend en Docker usa puerto 3081
VITE_BACKEND_PORT=3081

# 🌐 Configuración de la App
VITE_APP_NAME=Scraper Proxies MVP
VITE_APP_VERSION=1.0.0

# 🔧 Configuración de Desarrollo
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_LOGGING=true

# 📊 Configuración de Performance
VITE_QUERY_STALE_TIME=300000
VITE_QUERY_CACHE_TIME=600000

# 🔄 Configuración de Polling/Refresh
VITE_HEALTH_CHECK_INTERVAL=30000
VITE_AUTO_REFRESH_INTERVAL=60000
EOF
        echo -e "${GREEN}✅ Configurado para backend en Docker${NC}"
    fi
    
    echo -e "${YELLOW}📋 URLs:${NC}"
    echo -e "   Frontend: ${GREEN}http://localhost:5173${NC} (desarrollo)"
    echo -e "   Backend:  ${GREEN}http://localhost:3081${NC} (Docker)"
    echo ""
    echo -e "${YELLOW}💡 Para iniciar:${NC}"
    echo -e "   1. ${GREEN}./scripts/docker-deploy.sh --build${NC} (backend en Docker)"
    echo -e "   2. ${GREEN}cd apps/frontend && bun run dev${NC} (frontend desarrollo)"
fi

echo ""
echo -e "${BLUE}📋 Configuración actual:${NC}"
echo -e "   VITE_BACKEND_PORT: ${GREEN}$(grep VITE_BACKEND_PORT .env | cut -d'=' -f2)${NC}"

echo ""
echo -e "${YELLOW}🔄 Para cambiar de nuevo:${NC}"
echo -e "   ${GREEN}./scripts/switch-backend.sh native${NC}  # Backend nativo"
echo -e "   ${GREEN}./scripts/switch-backend.sh docker${NC}  # Backend Docker" 