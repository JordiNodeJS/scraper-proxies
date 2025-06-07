#!/bin/bash

# Script de Verificación Completa de Configuración
# Verifica que todo esté configurado correctamente para desarrollo y producción

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 VERIFICACIÓN COMPLETA DE CONFIGURACIÓN${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Function to check status
check_status() {
    local name="$1"
    local expected="$2"
    local actual="$3"
    
    echo -n "  📋 $name: "
    
    if [[ "$actual" == "$expected" ]]; then
        echo -e "${GREEN}✅ $actual${NC}"
        return 0
    else
        echo -e "${RED}❌ $actual (esperado: $expected)${NC}"
        return 1
    fi
}

# Function to check file content
check_file_content() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    echo -n "  📄 $description: "
    
    if [[ -f "$file" ]]; then
        if grep -q "$pattern" "$file"; then
            local value=$(grep "$pattern" "$file" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
            echo -e "${GREEN}✅ $value${NC}"
            return 0
        else
            echo -e "${RED}❌ Patrón no encontrado${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Archivo no existe${NC}"
        return 1
    fi
}

echo -e "${YELLOW}📋 1. VERIFICACIÓN DE PUERTOS CONFIGURADOS${NC}"
echo ""

# Verificar docker-compose.yml
echo -e "${BLUE}🐳 Docker Compose (Producción):${NC}"
check_file_content "docker-compose.yml" "3080:80" "Frontend port mapping"
check_file_content "docker-compose.yml" "3081:3001" "Backend port mapping"
check_file_content "docker-compose.yml" "CORS_ORIGIN=http://localhost:3080" "CORS origin"
check_file_content "docker-compose.yml" "VITE_API_URL=http://localhost:3081" "Frontend API URL"

echo ""

# Verificar configuración de desarrollo
echo -e "${BLUE}🏠 Configuración de Desarrollo:${NC}"
check_file_content "apps/frontend/.env.example" "VITE_BACKEND_PORT=3001" "Backend port por defecto"

echo ""

# Verificar configuración Docker del frontend
echo -e "${BLUE}🐳 Configuración Docker del Frontend:${NC}"
if [[ -f "apps/frontend/.env.docker" ]]; then
    check_file_content "apps/frontend/.env.docker" "VITE_API_URL=http://localhost:3081" "API URL Docker"
    check_file_content "apps/frontend/.env.docker" "VITE_BACKEND_PORT=3081" "Backend port Docker"
else
    echo -e "  📄 .env.docker: ${YELLOW}⚠️  No existe (se creará automáticamente)${NC}"
fi

echo ""

echo -e "${YELLOW}📋 2. VERIFICACIÓN DE BUILDS DE PRODUCCIÓN${NC}"
echo ""

# Verificar Dockerfile del backend
echo -e "${BLUE}🔧 Backend Dockerfile:${NC}"
if grep -q "FROM oven/bun:1-alpine AS production" Dockerfile; then
    echo -e "  📄 Build stage: ${GREEN}✅ production${NC}"
else
    echo -e "  📄 Build stage: ${RED}❌ No es production${NC}"
fi

if grep -q 'CMD \["bun", "run", "src/index.ts"\]' Dockerfile; then
    echo -e "  📄 Start command: ${GREEN}✅ bun run src/index.ts${NC}"
else
    echo -e "  📄 Start command: ${RED}❌ Comando incorrecto${NC}"
fi

echo ""

# Verificar Dockerfile del frontend
echo -e "${BLUE}🎨 Frontend Dockerfile:${NC}"
if grep -q "RUN bun run build" apps/frontend/Dockerfile; then
    echo -e "  📄 Build command: ${GREEN}✅ bun run build${NC}"
else
    echo -e "  📄 Build command: ${RED}❌ No usa build de producción${NC}"
fi

if grep -q "FROM nginx:alpine AS production" apps/frontend/Dockerfile; then
    echo -e "  📄 Production stage: ${GREEN}✅ nginx:alpine${NC}"
else
    echo -e "  📄 Production stage: ${RED}❌ No usa nginx${NC}"
fi

echo ""

# Verificar package.json del frontend
echo -e "${BLUE}📦 Frontend Package.json:${NC}"
if grep -q '"build": "tsc -b && vite build"' apps/frontend/package.json; then
    echo -e "  📄 Build script: ${GREEN}✅ tsc -b && vite build${NC}"
else
    echo -e "  📄 Build script: ${RED}❌ Script incorrecto${NC}"
fi

echo ""

echo -e "${YELLOW}📋 3. VERIFICACIÓN DE SCRIPTS${NC}"
echo ""

# Verificar scripts
echo -e "${BLUE}🔧 Scripts de Deployment:${NC}"
if grep -q "3080" scripts/docker-check.sh; then
    echo -e "  📄 docker-check.sh: ${GREEN}✅ Puertos 3080/3081${NC}"
else
    echo -e "  📄 docker-check.sh: ${RED}❌ Puertos incorrectos${NC}"
fi

if grep -q "http://localhost:3080" scripts/docker-deploy.sh; then
    echo -e "  📄 docker-deploy.sh: ${GREEN}✅ URLs correctas${NC}"
else
    echo -e "  📄 docker-deploy.sh: ${RED}❌ URLs incorrectas${NC}"
fi

if grep -q "puerto 3081" scripts/switch-backend.sh; then
    echo -e "  📄 switch-backend.sh: ${GREEN}✅ Puertos actualizados${NC}"
else
    echo -e "  📄 switch-backend.sh: ${RED}❌ Puertos no actualizados${NC}"
fi

echo ""

echo -e "${YELLOW}📋 4. RESUMEN DE CONFIGURACIÓN${NC}"
echo ""

echo -e "${BLUE}🏠 MODO DESARROLLO LOCAL:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:5173${NC} (Vite dev server)"
echo -e "  Backend:  ${GREEN}http://localhost:3001${NC} (Bun nativo)"
echo -e "  Comando:  ${GREEN}bun run dev${NC} (desde raíz)"

echo ""

echo -e "${BLUE}🐳 MODO PRODUCCIÓN DOCKER:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3080${NC} (nginx + build optimizado)"
echo -e "  Backend:  ${GREEN}http://localhost:3081${NC} (Bun + Playwright en Alpine)"
echo -e "  Comando:  ${GREEN}./scripts/docker-deploy.sh --build${NC}"

echo ""

echo -e "${YELLOW}💡 COMANDOS DE VERIFICACIÓN:${NC}"
echo ""
echo -e "${BLUE}Para desarrollo local:${NC}"
echo -e "  ${GREEN}./scripts/switch-backend.sh native${NC}"
echo -e "  ${GREEN}bun run dev${NC}"
echo -e "  ${GREEN}curl http://localhost:5173/api/test${NC}"

echo ""
echo -e "${BLUE}Para producción Docker:${NC}"
echo -e "  ${GREEN}./scripts/docker-check.sh${NC}"
echo -e "  ${GREEN}./scripts/docker-deploy.sh --build${NC}"
echo -e "  ${GREEN}curl http://localhost:3080${NC}"
echo -e "  ${GREEN}curl http://localhost:3081/health${NC}"

echo ""
echo -e "${GREEN}🎉 Verificación completada${NC}"
echo -e "${YELLOW}📋 Revisa cualquier ❌ mostrado arriba${NC}" 