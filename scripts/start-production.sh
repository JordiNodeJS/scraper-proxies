#!/bin/bash

# Script para iniciar las aplicaciones en modo producción
echo "🚀 Iniciando Scraper Proxies en modo PRODUCCIÓN..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar que las builds estén disponibles
if [ ! -d "apps/frontend/dist" ]; then
    echo "❌ Error: Build del frontend no encontrado. Ejecuta 'bun run build' primero."
    exit 1
fi

# Función para verificar si un puerto está ocupado
check_port() {
    local port=$1
    local service=$2
    if netstat -ano | grep ":$port " > /dev/null; then
        echo "⚠️ Puerto $port ya está ocupado ($service). Deteniendo proceso existente..."
        # En Windows, matar proceso por puerto es más complejo, mejor mostrar información
        echo "   Ejecuta: netstat -ano | findstr :$port y luego taskkill /PID <PID> /F"
    fi
}

# Verificar puertos
check_port 3001 "Backend"
check_port 4174 "Frontend"

echo ""
echo "📋 Iniciando servicios..."

# Iniciar backend
echo "🔧 Iniciando backend en puerto 3001..."
cd apps/backend
start cmd /k "echo BACKEND PRODUCTION && bun run start"
cd ../..

# Esperar un poco para que el backend inicie
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend en puerto 4174..."
cd apps/frontend
start cmd /k "echo FRONTEND PRODUCTION && bun run preview"
cd ../..

echo ""
echo "✅ Aplicaciones iniciadas en modo PRODUCCIÓN:"
echo "   🔧 Backend:  http://localhost:3001"
echo "   🎨 Frontend: http://localhost:4174"
echo ""
echo "🔍 Para verificar el estado:"
echo "   netstat -ano | findstr \"3001\\|4174\""
echo ""
echo "🔗 Accede a la aplicación en: http://localhost:4174"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 