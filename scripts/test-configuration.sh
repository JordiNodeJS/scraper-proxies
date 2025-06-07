#!/bin/bash

# Script de Testing de Configuración TypeScript
# Prueba que la nueva configuración funcione en desarrollo y producción

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 TESTING CONFIGURACIÓN TYPESCRIPT${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# Function to check if port is available
check_port() {
    local port=$1
    local name=$2
    
    if netstat -an 2>/dev/null | grep -q ":$port "; then
        echo -e "   ${RED}❌ Puerto $port ($name) está ocupado${NC}"
        return 1
    else
        echo -e "   ${GREEN}✅ Puerto $port ($name) disponible${NC}"
        return 0
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "   ${YELLOW}⏳ Esperando $name...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "   ${GREEN}✅ $name respondiendo${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "\n   ${RED}❌ $name no responde después de $max_attempts intentos${NC}"
    return 1
}

# Function to test API endpoint
test_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -e "   ${YELLOW}🔍 Testing $name...${NC}"
    
    local response=$(curl -s -w "%{http_code}" "$url" -o /tmp/test_response.json)
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "   ${GREEN}✅ $name: HTTP $response${NC}"
        return 0
    else
        echo -e "   ${RED}❌ $name: HTTP $response (esperado $expected_status)${NC}"
        return 1
    fi
}

# Function to cleanup processes
cleanup() {
    echo -e "\n${YELLOW}🧹 Limpiando procesos...${NC}"
    
    # Kill frontend dev server
    pkill -f "vite.*5173" 2>/dev/null || true
    
    # Kill backend dev server
    pkill -f "bun.*3001" 2>/dev/null || true
    
    # Kill Docker containers
    docker compose down 2>/dev/null || true
    
    sleep 2
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Trap to cleanup on exit
trap cleanup EXIT

echo -e "\n${BLUE}📋 FASE 1: VERIFICACIÓN INICIAL${NC}"
echo -e "${BLUE}─────────────────────────────────${NC}"

# Check if required files exist
echo -e "${YELLOW}🔍 Verificando archivos de configuración...${NC}"

required_files=(
    "apps/frontend/src/config/app.config.ts"
    "apps/frontend/src/config/environments/development.config.ts"
    "apps/frontend/src/config/environments/production.config.ts"
    "apps/backend/src/config/app.config.ts"
    "apps/backend/src/config/environments/development.config.ts"
    "apps/backend/src/config/environments/production.config.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅ $file${NC}"
    else
        echo -e "   ${RED}❌ $file${NC}"
        exit 1
    fi
done

echo -e "\n${BLUE}📋 FASE 2: TESTING DESARROLLO LOCAL${NC}"
echo -e "${BLUE}─────────────────────────────────────${NC}"

# Check ports availability
echo -e "${YELLOW}🔍 Verificando puertos para desarrollo...${NC}"
check_port 5173 "Frontend Dev"
check_port 3001 "Backend Dev"

# Start backend in development
echo -e "\n${YELLOW}🚀 Iniciando backend en desarrollo...${NC}"
cd apps/backend
NODE_ENV=development bun run dev &
BACKEND_PID=$!
cd ../..

# Wait for backend
wait_for_service "http://localhost:3001/health" "Backend Dev"

# Test backend endpoints
echo -e "\n${YELLOW}🧪 Testing endpoints del backend...${NC}"
test_endpoint "http://localhost:3001/health" "Health Check"
test_endpoint "http://localhost:3001/api/test" "API Test"

# Start frontend in development
echo -e "\n${YELLOW}🚀 Iniciando frontend en desarrollo...${NC}"
cd apps/frontend
bun run dev &
FRONTEND_PID=$!
cd ../..

# Wait for frontend
wait_for_service "http://localhost:5173" "Frontend Dev"

# Test frontend proxy
echo -e "\n${YELLOW}🧪 Testing proxy del frontend...${NC}"
test_endpoint "http://localhost:5173/health" "Frontend Proxy Health"
test_endpoint "http://localhost:5173/api/test" "Frontend Proxy API"

echo -e "\n${GREEN}✅ DESARROLLO LOCAL: EXITOSO${NC}"

# Stop development services
echo -e "\n${YELLOW}🛑 Deteniendo servicios de desarrollo...${NC}"
kill $BACKEND_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true
sleep 3

echo -e "\n${BLUE}📋 FASE 3: TESTING PRODUCCIÓN DOCKER${NC}"
echo -e "${BLUE}──────────────────────────────────────${NC}"

# Check ports availability for Docker
echo -e "${YELLOW}🔍 Verificando puertos para Docker...${NC}"
check_port 3080 "Frontend Docker"
check_port 3081 "Backend Docker"

# Build and start Docker services
echo -e "\n${YELLOW}🐳 Construyendo y iniciando servicios Docker...${NC}"
docker compose down 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# Wait for Docker services
wait_for_service "http://localhost:3081/health" "Backend Docker"
wait_for_service "http://localhost:3080" "Frontend Docker"

# Test Docker endpoints
echo -e "\n${YELLOW}🧪 Testing endpoints Docker...${NC}"
test_endpoint "http://localhost:3081/health" "Docker Backend Health"
test_endpoint "http://localhost:3081/api/test" "Docker Backend API"
test_endpoint "http://localhost:3080" "Docker Frontend" 200

echo -e "\n${GREEN}✅ PRODUCCIÓN DOCKER: EXITOSO${NC}"

# Final summary
echo -e "\n${BLUE}📊 RESUMEN FINAL${NC}"
echo -e "${BLUE}═══════════════${NC}"
echo -e "${GREEN}✅ Configuración TypeScript implementada correctamente${NC}"
echo -e "${GREEN}✅ Desarrollo local funcionando (5173/3001)${NC}"
echo -e "${GREEN}✅ Producción Docker funcionando (3080/3081)${NC}"
echo -e "${GREEN}✅ Eliminada dependencia de archivos .env${NC}"
echo -e "${GREEN}✅ Configuración automática por entorno${NC}"

echo -e "\n${BLUE}🎉 TESTING COMPLETADO EXITOSAMENTE${NC}" 