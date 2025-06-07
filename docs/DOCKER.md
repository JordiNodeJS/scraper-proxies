# 🐳 Docker - MVP Proxy Scraper

Documentación completa para ejecutar el MVP Proxy Scraper usando Docker.

## 📋 Requisitos Previos

- **Docker Desktop 4.0+** o **Docker Engine 20.10+**
- **Docker Compose V2** (incluido en Docker Desktop)
- **8GB RAM** mínimo recomendado
- **2GB espacio libre** en disco

### Verificación de Instalación

```bash
# Verificar Docker
docker --version
# Docker version 24.0.0+

# Verificar Docker Compose
docker compose version
# Docker Compose version v2.17.0+
```

## 🚀 Inicio Rápido

### Opción 1: Producción (Recomendado)

```bash
# 1. Build y Deploy automático
./scripts/docker-deploy.sh --build

# 2. Verificar servicios
docker compose ps

# 3. Acceder a la aplicación
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

### Opción 2: Desarrollo

```bash
# 1. Build y Deploy para desarrollo
./scripts/docker-deploy.sh --env dev --build

# 2. Verificar servicios
docker compose ps

# 3. Acceder a la aplicación
# Frontend: http://localhost:5173 (Hot reload)
# Backend:  http://localhost:3001 (Hot reload)
```

### Opción 3: Manual Paso a Paso

```bash
# 1. Build imágenes
./scripts/docker-build.sh --prod

# 2. Iniciar servicios
docker compose up -d

# 3. Ver logs
docker compose logs -f
```

## 🏗️ Arquitectura de Containers

### Servicios Principales

| Servicio   | Puerto | Descripción                    | Health Check |
| ---------- | ------ | ------------------------------ | ------------ |
| `frontend` | 3000   | React + Vite + Nginx          | ✅           |
| `backend`  | 3001   | Bun + Express + Playwright    | ✅           |
| `redis`    | 6379   | Cache y almacenamiento temporal | ✅           |

### Networking

- **Red personalizada**: `proxy-scraper-network`
- **DNS interno**: Los containers se comunican por nombre de servicio
- **Puertos expuestos**: Solo los necesarios para acceso externo

### Volúmenes

- `redis_data`: Persistencia de datos Redis
- `backend_logs`: Logs del backend

## 📊 Comandos Útiles

### Estado y Monitoreo

```bash
# Ver estado de servicios
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend

# Ver métricas de recursos
docker stats

# Health check manual
curl http://localhost:3000/health  # Frontend
curl http://localhost:3001/health  # Backend
```

### Control de Servicios

```bash
# Iniciar servicios
docker compose up -d

# Parar servicios
docker compose down

# Reiniciar un servicio
docker compose restart backend

# Escalar servicios (si es necesario)
docker compose up -d --scale backend=2
```

### Debugging

```bash
# Acceder al container del backend
docker compose exec backend sh

# Ver variables de entorno
docker compose exec backend env

# Ejecutar comando en container
docker compose exec backend bun --version

# Ver logs detallados
docker compose logs --details backend
```

## 🔧 Configuración Avanzada

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Backend Configuration
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Frontend Configuration  
VITE_API_URL=http://localhost:3001

# Redis Configuration
REDIS_URL=redis://redis:6379
```

### Desarrollo con Hot Reload

Para desarrollo activo con hot reload:

```bash
# Usar override de desarrollo
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Los cambios en el código se reflejan automáticamente
# Frontend: Hot Module Replacement (HMR)
# Backend: Auto-restart con Bun
```

### Build Personalizado

```bash
# Build sin cache
./scripts/docker-build.sh --no-cache

# Build con output detallado
./scripts/docker-build.sh --verbose

# Build solo para desarrollo
./scripts/docker-build.sh --dev
```

## 🧪 Testing en Docker

### Tests Unitarios

```bash
# Ejecutar tests en el container
docker compose exec backend bun test

# Tests con coverage
docker compose exec backend bun test --coverage
```

### Tests de Integración

```bash
# Playwright tests
docker compose exec backend bunx playwright test

# Tests específicos
docker compose exec backend bunx playwright test --grep "scraping"
```

### Health Checks

Los health checks se ejecutan automáticamente cada 30 segundos:

```bash
# Ver estado de health checks
docker compose ps

# Forzar health check manual
docker compose exec backend curl -f http://localhost:3001/health
docker compose exec frontend curl -f http://localhost/health
```

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Error de Puerto Ocupado

```bash
Error: bind: address already in use

# Solución:
docker compose down
./scripts/docker-cleanup.sh
```

#### 2. Fallo en Health Check

```bash
# Ver logs del servicio con problemas
docker compose logs backend

# Reiniciar el servicio
docker compose restart backend

# Si persiste, rebuilding
docker compose up --build backend
```

#### 3. Error de Permisos

```bash
# En Windows con WSL2
docker compose exec backend chown -R bun:nodejs /app
```

#### 4. Memoria Insuficiente

```bash
# Verificar recursos disponibles
docker system df
docker stats

# Limpiar recursos no utilizados
./scripts/docker-cleanup.sh --all
```

### Logs de Debugging

```bash
# Logs detallados de Docker Compose
COMPOSE_LOG_LEVEL=DEBUG docker compose up

# Logs de build
docker compose build --progress=plain

# Logs de networking
docker network inspect proxy-scraper-network
```

## 🧹 Mantenimiento

### Limpieza Regular

```bash
# Limpieza básica (contenedores e imágenes)
./scripts/docker-cleanup.sh

# Limpieza completa (incluye volúmenes)
./scripts/docker-cleanup.sh --all --volumes

# Limpieza forzada (sin confirmación)
./scripts/docker-cleanup.sh --all --force
```

### Backup y Restore

```bash
# Backup automático (se ejecuta en cada deploy)
./scripts/docker-deploy.sh --build

# Rollback al último backup
./scripts/docker-deploy.sh --rollback

# Backup manual de volúmenes
docker run --rm -v scraper-proxies_redis_data:/data \
  -v $(pwd)/backups:/backup alpine \
  tar czf /backup/redis-$(date +%Y%m%d).tar.gz -C /data .
```

### Actualizaciones

```bash
# Actualizar imágenes base
docker compose pull

# Rebuilding completo
./scripts/docker-build.sh --no-cache --prod

# Deploy con rebuild
./scripts/docker-deploy.sh --build
```

## 📈 Performance y Optimización

### Métricas de Performance

- **Build Time**: < 3 minutos total
- **Startup Time**: < 30 segundos
- **Memory Usage**: Frontend < 128MB, Backend < 256MB
- **Image Size**: Frontend < 50MB, Backend < 200MB

### Optimizaciones Aplicadas

1. **Multi-stage builds** para reducir tamaño de imágenes
2. **Alpine Linux** como base para menor footprint
3. **Build cache** optimizado para desarrollo
4. **Health checks** configurados correctamente
5. **Resource limits** definidos en compose
6. **Networking** optimizado entre containers

### Monitoreo

```bash
# Métricas en tiempo real
docker stats

# Uso de recursos por servicio
docker compose top

# Inspeccionar un container específico
docker inspect proxy-scraper-backend
```

## 🔐 Seguridad

### Medidas Implementadas

- **Usuarios no-root** en todos los containers
- **Security headers** en nginx
- **Rate limiting** configurado
- **Network isolation** entre servicios
- **Secrets management** con variables de entorno

### Recomendaciones

```bash
# Escaneo de vulnerabilidades
docker scout cves proxy-scraper-backend:latest

# Auditoría de configuración
docker compose config --quiet

# Verificar permisos
docker compose exec backend id
```

## 📚 Referencias

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Bun Docker Guide](https://bun.sh/guides/ecosystem/docker)
- [Nginx Docker Documentation](https://hub.docker.com/_/nginx)

---

**Nota**: Esta documentación asume Docker Desktop en Windows. Para Linux o macOS, los comandos son idénticos pero pueden requerir `sudo` en algunos casos. 