#!/bin/bash

# Script de Verificación Docker para MVP Proxy Scraper
# Uso: ./scripts/docker-check.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 MVP Proxy Scraper - Docker System Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Function to check status
check_status() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "  🔍 $name: "
    
    if eval "$command" >/dev/null 2>&1; then
        if [[ -n "$expected" ]]; then
            local result=$(eval "$command" 2>/dev/null)
            echo -e "${GREEN}✅ $result${NC}"
        else
            echo -e "${GREEN}✅ OK${NC}"
        fi
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# Function to check requirement
check_requirement() {
    local name="$1"
    local command="$2"
    local min_version="$3"
    
    echo -n "  📋 $name: "
    
    if command -v $(echo "$command" | cut -d' ' -f1) >/dev/null 2>&1; then
        local version=$(eval "$command" 2>/dev/null)
        echo -e "${GREEN}✅ $version${NC}"
        if [[ -n "$min_version" ]]; then
            echo -e "     ${YELLOW}Mínimo requerido: $min_version${NC}"
        fi
        return 0
    else
        echo -e "${RED}❌ No instalado${NC}"
        return 1
    fi
}

# System Requirements Check
echo -e "${YELLOW}📋 Verificando Requisitos del Sistema...${NC}"

requirements_ok=true

if ! check_requirement "Docker Engine" "docker --version" "20.10+"; then
    requirements_ok=false
fi

if ! check_requirement "Docker Compose" "docker compose version" "v2.0+"; then
    requirements_ok=false
fi

if ! check_requirement "Bun Runtime" "bun --version" "1.0+"; then
    requirements_ok=false
fi

echo ""

# Docker Service Check
echo -e "${YELLOW}🐳 Verificando Estado de Docker...${NC}"

docker_ok=true

if ! check_status "Docker Daemon" "docker info"; then
    docker_ok=false
    echo -e "${RED}    ❌ Docker no está ejecutándose${NC}"
    echo -e "${YELLOW}    💡 Solución: Iniciar Docker Desktop${NC}"
fi

if [[ "$docker_ok" = "true" ]]; then
    check_status "Docker Version" "docker version --format '{{.Server.Version}}'"
    check_status "Docker Compose" "docker compose version --short"
fi

echo ""

# System Resources Check
echo -e "${YELLOW}💾 Verificando Recursos del Sistema...${NC}"

# Available memory
if command -v free >/dev/null 2>&1; then
    memory_gb=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $memory_gb -ge 8 ]]; then
        echo -e "  📊 Memoria disponible: ${GREEN}✅ ${memory_gb}GB${NC}"
    else
        echo -e "  📊 Memoria disponible: ${YELLOW}⚠️  ${memory_gb}GB (recomendado: 8GB+)${NC}"
    fi
fi

# Disk space
disk_space=$(df . | awk 'NR==2 {print int($4/1024/1024)}')
if [[ $disk_space -ge 2 ]]; then
    echo -e "  💽 Espacio en disco: ${GREEN}✅ ${disk_space}GB disponible${NC}"
else
    echo -e "  💽 Espacio en disco: ${YELLOW}⚠️  ${disk_space}GB (recomendado: 2GB+)${NC}"
fi

# Docker system resources
if [[ "$docker_ok" = "true" ]]; then
    echo -e "  🐳 Docker system info:"
    docker system df | sed 's/^/      /'
fi

echo ""

# Project Files Check
echo -e "${YELLOW}📁 Verificando Archivos del Proyecto...${NC}"

files_ok=true

project_files=(
    "docker-compose.yml:Docker Compose principal"
    "Dockerfile:Backend Dockerfile"
    "apps/frontend/Dockerfile:Frontend Dockerfile" 
    "apps/frontend/nginx.conf:Nginx config"
    ".env.example:Variables de entorno ejemplo"
)

for file_info in "${project_files[@]}"; do
    file=$(echo "$file_info" | cut -d':' -f1)
    desc=$(echo "$file_info" | cut -d':' -f2)
    
    if [[ -f "$file" ]]; then
        echo -e "  📄 $desc: ${GREEN}✅ $file${NC}"
    else
        echo -e "  📄 $desc: ${RED}❌ $file${NC}"
        files_ok=false
    fi
done

# Check .env file
if [[ -f ".env" ]]; then
    echo -e "  🔧 Variables de entorno: ${GREEN}✅ .env${NC}"
else
    echo -e "  🔧 Variables de entorno: ${YELLOW}⚠️  .env (se usará .env.example)${NC}"
fi

echo ""

# Network Connectivity Check
echo -e "${YELLOW}🌐 Verificando Conectividad...${NC}"

if ping -c 1 google.com >/dev/null 2>&1; then
    echo -e "  🌍 Internet: ${GREEN}✅ Conectado${NC}"
else
    echo -e "  🌍 Internet: ${RED}❌ Sin conexión${NC}"
fi

if [[ "$docker_ok" = "true" ]]; then
    if docker pull hello-world >/dev/null 2>&1; then
        echo -e "  🐳 Docker Hub: ${GREEN}✅ Accesible${NC}"
        docker rmi hello-world >/dev/null 2>&1
    else
        echo -e "  🐳 Docker Hub: ${RED}❌ No accesible${NC}"
    fi
fi

echo ""

# Port Availability Check
echo -e "${YELLOW}🔌 Verificando Puertos...${NC}"

ports_to_check=(3000 3001)
ports_ok=true

for port in "${ports_to_check[@]}"; do
    # Check if running on Windows (Git Bash/MINGW)
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$MSYSTEM" == "MINGW64" ]]; then
        # Windows netstat command
        if netstat -an 2>/dev/null | grep ":$port " >/dev/null 2>&1; then
            echo -e "  🔌 Puerto $port: ${RED}❌ Ocupado${NC}"
            ports_ok=false
        else
            echo -e "  🔌 Puerto $port: ${GREEN}✅ Disponible${NC}"
        fi
    elif command -v netstat >/dev/null 2>&1; then
        # Linux/macOS netstat command
        if netstat -tuln 2>/dev/null | grep ":$port " >/dev/null 2>&1; then
            echo -e "  🔌 Puerto $port: ${RED}❌ Ocupado${NC}"
            ports_ok=false
        else
            echo -e "  🔌 Puerto $port: ${GREEN}✅ Disponible${NC}"
        fi
    elif command -v ss >/dev/null 2>&1; then
        # Alternative with ss command
        if ss -tuln 2>/dev/null | grep ":$port " >/dev/null 2>&1; then
            echo -e "  🔌 Puerto $port: ${RED}❌ Ocupado${NC}"
            ports_ok=false
        else
            echo -e "  🔌 Puerto $port: ${GREEN}✅ Disponible${NC}"
        fi
    else
        echo -e "  🔌 Puerto $port: ${YELLOW}⚠️  No se puede verificar${NC}"
    fi
done

echo ""

# Final Summary
echo -e "${BLUE}📊 Resumen del Chequeo:${NC}"

overall_status=true

if [[ "$requirements_ok" = "false" ]]; then
    echo -e "  ❌ Requisitos del sistema: ${RED}FAIL${NC}"
    overall_status=false
else
    echo -e "  ✅ Requisitos del sistema: ${GREEN}OK${NC}"
fi

if [[ "$docker_ok" = "false" ]]; then
    echo -e "  ❌ Docker: ${RED}FAIL${NC}"
    overall_status=false
else
    echo -e "  ✅ Docker: ${GREEN}OK${NC}"
fi

if [[ "$files_ok" = "false" ]]; then
    echo -e "  ❌ Archivos del proyecto: ${RED}FAIL${NC}"
    overall_status=false
else
    echo -e "  ✅ Archivos del proyecto: ${GREEN}OK${NC}"
fi

if [[ "$ports_ok" = "false" ]]; then
    echo -e "  ⚠️  Puertos: ${YELLOW}SOME OCCUPIED${NC}"
else
    echo -e "  ✅ Puertos: ${GREEN}OK${NC}"
fi

echo ""

# Recommendations
if [[ "$overall_status" = "true" ]]; then
    echo -e "${GREEN}🎉 Sistema listo para Docker deployment!${NC}"
    echo ""
    echo -e "${YELLOW}💡 Próximos pasos recomendados:${NC}"
    echo -e "   1. ${GREEN}./scripts/docker-build.sh${NC}"
    echo -e "   2. ${GREEN}./scripts/docker-deploy.sh${NC}"
    echo -e "   3. ${GREEN}docker compose up -d${NC}"
else
    echo -e "${RED}❌ Sistema NO está listo para deployment${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Acciones requeridas:${NC}"
    
    if [[ "$docker_ok" = "false" ]]; then
        echo -e "   1. ${YELLOW}Iniciar Docker Desktop${NC}"
    fi
    
    if [[ "$requirements_ok" = "false" ]]; then
        echo -e "   2. ${YELLOW}Instalar dependencias faltantes${NC}"
    fi
    
    if [[ "$ports_ok" = "false" ]]; then
        echo -e "   3. ${YELLOW}Liberar puertos ocupados${NC}"
        echo -e "      ${GREEN}./scripts/docker-cleanup.sh${NC}"
    fi
    
    if [[ "$files_ok" = "false" ]]; then
        echo -e "   4. ${YELLOW}Verificar archivos del proyecto${NC}"
    fi
fi

# Exit with appropriate code
if [[ "$overall_status" = "true" ]]; then
    exit 0
else
    exit 1
fi 