#!/bin/bash

# Script de Debug para verificar configuración Docker
# Uso: ./scripts/debug-docker-config.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Debug de Configuración Docker${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

echo -e "${YELLOW}📋 Archivos Docker Compose disponibles:${NC}"
if [[ -f "docker-compose.local.yml" ]]; then
    echo -e "   ✅ docker-compose.local.yml (LOCAL)"
else
    echo -e "   ❌ docker-compose.local.yml (NO ENCONTRADO)"
fi

if [[ -f "docker-compose.aws.yml" ]]; then
    echo -e "   ✅ docker-compose.aws.yml (AWS)"
else
    echo -e "   ❌ docker-compose.aws.yml (NO ENCONTRADO)"
fi

echo ""
echo -e "${YELLOW}🔧 Configuración en docker-compose.local.yml:${NC}"
if [[ -f "docker-compose.local.yml" ]]; then
    echo -e "${BLUE}   CORS_ORIGIN:${NC}"
    grep "CORS_ORIGIN" docker-compose.local.yml | head -1
    echo -e "${BLUE}   VITE_API_URL:${NC}"
    grep "VITE_API_URL" docker-compose.local.yml | head -1
    echo -e "${BLUE}   Puertos:${NC}"
    grep -A1 "ports:" docker-compose.local.yml | grep -E "3800|3801"
fi

echo ""
echo -e "${YELLOW}🌐 Configuración en docker-compose.aws.yml:${NC}"
if [[ -f "docker-compose.aws.yml" ]]; then
    echo -e "${BLUE}   CORS_ORIGIN:${NC}"
    grep "CORS_ORIGIN" docker-compose.aws.yml | head -1
    echo -e "${BLUE}   VITE_API_URL:${NC}"
    grep "VITE_API_URL" docker-compose.aws.yml | head -1
    echo -e "${BLUE}   Puertos:${NC}"
    grep -A1 "ports:" docker-compose.aws.yml | grep -E "3080|3081"
fi

echo ""
echo -e "${YELLOW}🐳 Contenedores Docker activos:${NC}"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}" | grep -E "(proxy-scraper|NAMES)"

echo ""
echo -e "${YELLOW}📡 IP Local detectada:${NC}"
if command -v hostname &> /dev/null; then
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        LOCAL_IP=$(ipconfig | grep "IPv4" | grep -v "127.0.0.1" | head -1 | awk '{print $NF}' | tr -d '\r')
    else
        # Linux/Mac
        LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ip route get 1 | awk '{print $7}' 2>/dev/null || echo "")
    fi
    
    if [[ -n "$LOCAL_IP" ]]; then
        echo -e "   IP Local: ${GREEN}${LOCAL_IP}${NC}"
    else
        echo -e "   ${YELLOW}No se pudo detectar IP local${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}🧪 Test de conectividad:${NC}"
echo -e "${BLUE}   Testing localhost:3800...${NC}"
if curl -s --connect-timeout 3 http://localhost:3800 > /dev/null; then
    echo -e "   ✅ Frontend LOCAL respondiendo"
else
    echo -e "   ❌ Frontend LOCAL no responde"
fi

echo -e "${BLUE}   Testing localhost:3801...${NC}"
if curl -s --connect-timeout 3 http://localhost:3801/health > /dev/null; then
    echo -e "   ✅ Backend LOCAL respondiendo"
else
    echo -e "   ❌ Backend LOCAL no responde"
fi

echo -e "${BLUE}   Testing localhost:3080...${NC}"
if curl -s --connect-timeout 3 http://localhost:3080 > /dev/null; then
    echo -e "   ✅ Frontend AWS respondiendo"
else
    echo -e "   ❌ Frontend AWS no responde"
fi

echo -e "${BLUE}   Testing localhost:3081...${NC}"
if curl -s --connect-timeout 3 http://localhost:3081/health > /dev/null; then
    echo -e "   ✅ Backend AWS respondiendo"
else
    echo -e "   ❌ Backend AWS no responde"
fi

echo ""
echo -e "${BLUE}💡 Recomendaciones:${NC}"
echo -e "   Para LOCAL: ${GREEN}./scripts/docker-deploy-local.sh --build${NC}"
echo -e "   Para AWS:   ${GREEN}./scripts/docker-deploy-aws.sh --build${NC}"
echo -e "   Debug:      ${GREEN}./scripts/debug-docker-config.sh${NC}" 