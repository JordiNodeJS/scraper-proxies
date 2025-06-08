#!/bin/bash

# Script para desplegar MVP Proxy Scraper en configuración HTTP SIMPLE
# Acceso: http://servidor:3080 (frontend) y http://servidor:3081 (backend)

set -e

echo "🚀 Desplegando MVP Proxy Scraper - HTTP SIMPLE"
echo "=============================================="

# Variables
PROJECT_DIR="/home/ubuntu/projects/scraper-proxies"
SERVER_IP="ec2-3-254-74-19.eu-west-1.compute.amazonaws.com"

echo "📋 Configuración:"
echo "  - Frontend: http://${SERVER_IP}:3080"
echo "  - Backend:  http://${SERVER_IP}:3081"
echo "  - Protocolo: HTTP (simple)"
echo ""

# Función para logging
log() {
    echo "$(date '+%H:%M:%S') $1"
}

# 1. Parar servicios existentes
log "🛑 Deteniendo servicios existentes..."
docker compose down --remove-orphans || true

# 2. Eliminar configuraciones de nginx/ssl anteriores si existen
log "🧹 Limpiando configuraciones HTTPS anteriores..."
sudo rm -rf /etc/nginx/sites-enabled/scraper-proxies || true
sudo rm -rf /etc/nginx/sites-available/scraper-proxies || true
sudo systemctl stop nginx || true
sudo systemctl disable nginx || true

# 3. Limpiar imágenes Docker anteriores
log "🧹 Limpiando imágenes Docker anteriores..."
docker system prune -f

# 4. Construir nuevas imágenes
log "🔨 Construyendo nuevas imágenes Docker..."
docker compose build --no-cache

# 5. Iniciar servicios
log "▶️  Iniciando servicios HTTP..."
docker compose up -d

# 6. Esperar que los servicios estén healthy
log "⏳ Esperando que los servicios estén listos..."
sleep 30

# 7. Verificar estado de los servicios
log "🔍 Verificando estado de los servicios..."
docker compose ps

# 8. Hacer health checks
log "🩺 Verificando conectividad..."

# Check backend
if curl -f "http://localhost:3081/health" >/dev/null 2>&1; then
    log "✅ Backend funcionando (puerto 3081)"
else
    log "❌ Backend no responde (puerto 3081)"
fi

# Check frontend
if curl -f "http://localhost:3080/" >/dev/null 2>&1; then
    log "✅ Frontend funcionando (puerto 3080)"
else
    log "❌ Frontend no responde (puerto 3080)"
fi

# 9. Mostrar URLs finales
echo ""
log "🎉 Despliegue HTTP completado!"
echo "=============================================="
echo "📱 Frontend: http://${SERVER_IP}:3080"
echo "🔧 Backend:  http://${SERVER_IP}:3081"
echo "🔍 Health:   http://${SERVER_IP}:3081/health"
echo ""
echo "📋 Logs en tiempo real:"
echo "  docker compose logs -f"
echo ""
echo "🛑 Para detener:"
echo "  docker compose down"
echo ""

log "✅ Script completado exitosamente" 