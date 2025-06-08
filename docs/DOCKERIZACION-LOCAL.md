# 🐳 Dockerización Local - MVP Proxy Scraper

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura Docker](#arquitectura-docker)
3. [Configuración Inicial](#configuración-inicial)
4. [Comandos de Docker](#comandos-de-docker)
5. [Proceso de Construcción](#proceso-de-construcción)
6. [Verificación y Testing](#verificación-y-testing)
7. [Troubleshooting](#troubleshooting)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Comparación con Desarrollo Nativo](#comparación-con-desarrollo-nativo)

## 🎯 Introducción

Este documento explica cómo dockerizar completamente el MVP Proxy Scraper para entornos locales de desarrollo y testing. La dockerización permite:

- **Consistencia**: Mismo entorno en cualquier máquina
- **Aislamiento**: Sin conflictos con otras aplicaciones
- **Portabilidad**: Fácil distribución y despliegue
- **Testing**: Simulación de entorno de producción

> **💡 Nota Importante**: Para desarrollo diario se recomienda usar el modo nativo (`bun run dev`) por su velocidad y hot reload. Docker local es ideal para testing de integración y validación pre-deploy.

## 🏗️ Arquitectura Docker

### Servicios Configurados

```yaml
# docker-compose.yml
services:
  frontend:
    - Puerto: 3080 (externo) → 80 (interno)
    - Tecnología: Nginx + React build
    - Tamaño: ~74MB
    
  backend:
    - Puerto: 3081 (externo) → 3001 (interno)
    - Tecnología: Bun + Express + Playwright
    - Tamaño: ~1.3GB (incluye Playwright browsers)
```

### Diagrama de Arquitectura

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   (React)       │    │   (Bun+Express) │
│   Port: 3080    │◄──►│   Port: 3081    │
│   Nginx         │    │   Playwright    │
└─────────────────┘    └─────────────────┘
```

## ⚙️ Configuración Inicial

### 1. Verificar Requisitos

```bash
# Verificar Docker instalado
docker --version
# Docker version 24.0.0 o superior

# Verificar Docker Compose
docker compose version
# Docker Compose version v2.20.0 o superior
```

### 2. Configurar Variables de Entorno

El proyecto usa configuración TypeScript automática. Docker Compose incluye las variables necesarias:

```bash
# Verificar configuración actual
cat apps/frontend/src/config/environments/production.config.ts
cat apps/backend/src/config/environments/production.config.ts

# Variables en docker-compose.yml:
# VITE_API_URL=http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081
# CORS_ORIGIN=http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080
```

### 3. Estructura de Archivos Docker

```
scraper-proxies/
├── docker-compose.yml           # Configuración principal
├── Dockerfile                   # Backend container
├── apps/
│   └── frontend/
│       ├── Dockerfile          # Frontend container
│       └── nginx.conf          # Configuración Nginx
└── scripts/
    ├── docker-build.sh         # Script de construcción
    ├── docker-deploy.sh        # Script de despliegue
    ├── docker-check.sh         # Script de verificación
    └── kill-ports.js           # Limpieza de puertos
```

## 🚀 Comandos de Docker

### Comandos Básicos

```bash
# 1. Construcción completa (primera vez)
./scripts/docker-build.sh

# 2. Despliegue con construcción
./scripts/docker-deploy.sh --build

# 3. Despliegue sin construcción
./scripts/docker-deploy.sh

# 4. Verificar estado
./scripts/docker-check.sh

# 5. Parar servicios
docker compose down

# 6. Parar y limpiar volúmenes
docker compose down -v

# 7. Limpiar puertos ocupados
node scripts/kill-ports.js
```

### Comandos Avanzados

```bash
# Construcción sin cache (limpia)
docker compose build --no-cache

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f frontend
docker compose logs -f backend

# Ejecutar comandos dentro de containers
docker compose exec backend bun --version
docker compose exec frontend nginx -v

# Inspeccionar containers
docker compose ps
docker compose top
```

## 🔨 Proceso de Construcción

### 1. Construcción del Frontend

```dockerfile
# apps/frontend/Dockerfile
FROM node:20-alpine AS builder
RUN npm install -g bun
WORKDIR /app
COPY package.json bun.lock* ./
COPY apps/frontend/package.json ./apps/frontend/
RUN bun install
COPY apps/frontend/ ./apps/frontend/
WORKDIR /app/apps/frontend
RUN bun run build

FROM nginx:alpine AS production
RUN apk add --no-cache curl
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

**Proceso:**
1. Multi-stage build con Node.js 20 Alpine
2. Instala Bun globalmente
3. Instala dependencias del monorepo
4. Construye aplicación React con Vite
5. Copia build a imagen Nginx optimizada
6. Incluye curl para health checks

### 2. Construcción del Backend

```dockerfile
# Dockerfile (backend)
FROM oven/bun:1-alpine AS production
WORKDIR /app

# Instalar dependencias del sistema para Playwright
RUN apk add --no-cache \
    chromium nss freetype harfbuzz ca-certificates \
    ttf-freefont curl

# Configurar Playwright para usar Chromium del sistema
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar dependencias y código
COPY package.json bun.lock* ./
COPY apps/backend/package.json ./apps/backend/
RUN bun install
COPY apps/backend ./apps/backend

# Configurar usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser bun nodejs && \
    chown -R bun:nodejs /app
USER bun

EXPOSE 3001
WORKDIR /app/apps/backend
CMD ["bun", "run", "src/index.ts"]
```

**Proceso:**
1. Usa imagen oficial Bun Alpine
2. Instala Chromium del sistema (más eficiente)
3. Configura variables de entorno Playwright
4. Instala dependencias del monorepo
5. Configura usuario no-root para seguridad
6. Health checks incluidos

### 3. Tiempos de Construcción

| Servicio | Primera Construcción | Reconstrucción | Startup |
|----------|---------------------|----------------|---------|
| Frontend | ~45 segundos        | ~15 segundos   | ~3s     |
| Backend  | ~180 segundos       | ~30 segundos   | ~8s     |
| **Total**| **~4 minutos**      | **~1 minuto**  | **~11s**|

## ✅ Verificación y Testing

### 1. Health Checks Automáticos

```bash
# Verificar todos los servicios
./scripts/docker-check.sh

# Salida esperada:
# ✅ Frontend (3080): OK - Response time: 45ms
# ✅ Backend (3081): OK - Response time: 62ms  
# ✅ All services are healthy!
```

### 2. Testing Manual

```bash
# Frontend - Aplicación web
curl -I http://localhost:3080
# HTTP/1.1 200 OK

# Backend - API Health
curl http://localhost:3081/health
# {"status":"OK","timestamp":"2024-01-15T10:30:00.000Z"}

# Backend - API Test
curl http://localhost:3081/api/test
# {"status":"functional","message":"API working correctly"}

# Backend - Scraping Test
curl -X POST http://localhost:3081/api/scrape/test
# {"success":true,"data":{"total":5,"proxies":[...]}}
```

### 3. Testing de Funcionalidades

```bash
# Test completo de scraping
curl -X POST http://localhost:3081/api/scrape/direct \
  -H "Content-Type: application/json" \
  -d '{"sources":["free-proxy-list"]}'

# Validación de proxies
curl -X POST http://localhost:3081/api/validate/proxies \
  -H "Content-Type: application/json" \
  -d '{"proxies":[{"ip":"1.1.1.1","port":8080,"type":"HTTP"}]}'
```

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Puerto ya en uso

```bash
# Error: Port 3080 is already in use
# Solución: Usar script automatizado
node scripts/kill-ports.js

# O matar puertos específicos:
node scripts/kill-ports.js 3080 3081

# Manualmente en Windows:
netstat -ano | findstr :3080
taskkill /PID <PID> /F

# Manualmente en Linux/Mac:
lsof -ti:3080 | xargs kill -9
lsof -ti:3081 | xargs kill -9
```

#### 2. Error de construcción Frontend

```bash
# Error: VITE build failed
# Solución: Limpiar cache y reconstruir
docker compose build --no-cache frontend
```

#### 3. Error de Playwright en Backend

```bash
# Error: Browser not found
# Solución: Reinstalar navegadores
docker compose exec backend bunx playwright install chromium
```

#### 4. Error de CORS

```bash
# Error: CORS policy blocked
# Verificar configuración CORS:
docker compose exec backend cat src/config/environments/production.config.ts

# Verificar variables de entorno:
docker compose exec backend env | grep CORS

# La configuración debe incluir el origen del frontend
```

#### 5. Error de conectividad Frontend-Backend

```bash
# Error: Cannot connect to backend
# Verificar que ambos servicios estén corriendo:
docker compose ps

# Verificar logs:
docker compose logs backend
docker compose logs frontend
```

### Logs de Debugging

```bash
# Ver todos los logs
docker compose logs

# Logs específicos con timestamps
docker compose logs -f --timestamps backend

# Filtrar logs por nivel
docker compose logs backend | grep ERROR
docker compose logs backend | grep WARN
```

### Limpieza Completa

```bash
# Parar y eliminar todo
docker compose down -v --remove-orphans

# Limpiar imágenes no usadas
docker image prune -f

# Limpiar sistema completo (CUIDADO)
docker system prune -a --volumes
```

## 🎯 Mejores Prácticas

### 1. Desarrollo Eficiente

```bash
# Para desarrollo activo, usar modo nativo:
bun run dev  # Más rápido, hot reload

# Para testing de integración, usar Docker:
./scripts/docker-deploy.sh --build
```

### 2. Optimización de Builds

```bash
# Usar .dockerignore para excluir archivos innecesarios
echo "node_modules\n.git\n*.md\ndocs/" > .dockerignore

# Construcción en paralelo
docker compose build --parallel
```

### 3. Monitoreo de Recursos

```bash
# Ver uso de recursos
docker stats

# Ver espacio usado por imágenes
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Limpiar imágenes antiguas
docker image prune -f
```

### 4. Backup y Restore

```bash
# Backup de logs del backend
docker run --rm -v scraper-proxies_backend_logs:/data \
  -v $(pwd):/backup alpine tar czf /backup/backend-logs-backup.tar.gz /data

# Restore de logs
docker run --rm -v scraper-proxies_backend_logs:/data \
  -v $(pwd):/backup alpine tar xzf /backup/backend-logs-backup.tar.gz -C /
```

## 📊 Comparación con Desarrollo Nativo

| Aspecto | Desarrollo Nativo | Docker Local |
|---------|------------------|--------------|
| **Startup** | ~5 segundos | ~11 segundos |
| **Hot Reload** | ✅ Instantáneo | ❌ No disponible |
| **Debugging** | ✅ Directo | ⚠️ Logs containers |
| **Recursos** | ~200MB RAM | ~600MB RAM |
| **Consistencia** | ⚠️ Depende del SO | ✅ Idéntico siempre |
| **Aislamiento** | ❌ Conflictos posibles | ✅ Completamente aislado |
| **Testing Producción** | ❌ Diferente entorno | ✅ Idéntico a producción |

### Recomendaciones de Uso

- **Desarrollo diario**: Usar modo nativo (`bun run dev`) - Puertos 5173/3001
- **Testing de integración**: Usar Docker local - Puertos 3080/3081
- **Validación pre-deploy**: Usar Docker local
- **Demostración**: Usar Docker local
- **CI/CD**: Usar Docker siempre

### Comandos de Desarrollo Nativo (Recomendado para desarrollo)

```bash
# Desarrollo nativo con hot reload
bun run dev                   # Ambos servicios (concurrente)
bun run dev:frontend          # Solo frontend (puerto 5173)
bun run dev:backend           # Solo backend (puerto 3001)

# Limpiar puertos antes de desarrollo
node scripts/kill-ports.js   # Limpia 3001, 5173, 3002, 4173

# URLs desarrollo nativo:
# Frontend: http://localhost:5173 (Vite dev server)
# Backend:  http://localhost:3001 (Bun nativo)
```

## 🔗 Enlaces Relacionados

- [README Principal](../README.md#-docker-producción)
- [Configuración TypeScript](./CONFIGURACION-TYPESCRIPT-TESTING-EXITOSO.md)
- [Docker Production Only](./DOCKER-PRODUCTION-ONLY.md)
- [Scripts de Automatización](../scripts/)

## 📝 Comandos de Referencia Rápida

```bash
# Setup inicial
git clone <repo>
cd scraper-proxies
bun install

# Primera vez
./scripts/docker-build.sh
./scripts/docker-deploy.sh --build

# Desarrollo
./scripts/docker-check.sh    # Verificar estado
docker compose logs -f       # Ver logs
docker compose ps            # Estado servicios
docker compose down          # Parar servicios

# Troubleshooting
node scripts/kill-ports.js   # Limpiar puertos (3080, 3081)
docker compose build --no-cache  # Reconstruir limpio
docker system prune -f       # Limpiar sistema

# URLs de acceso
# Frontend: http://localhost:3080
# Backend:  http://localhost:3081
```

---

**Nota**: Este documento cubre la dockerización local. Para despliegue en producción, consultar [DOCKER-PRODUCTION-ONLY.md](./DOCKER-PRODUCTION-ONLY.md). 