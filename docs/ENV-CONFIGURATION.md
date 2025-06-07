# 📝 Configuración de Variables de Entorno

## 🎯 Archivo de Referencia para Variables de Entorno

Este documento explica todas las variables de entorno disponibles en el proyecto Scraper de Proxies.

### 📁 Estructura de Archivos .env

```bash
# Archivos de ejemplo (para referencia)
.env.example                    # Variables globales (opcional)
apps/frontend/.env.example      # Variables del frontend  
apps/backend/.env.example       # Variables del backend

# Archivos reales (crear según necesidad)
apps/frontend/.env              # Frontend desarrollo
apps/frontend/.env.production   # Frontend producción
apps/backend/.env               # Backend desarrollo  
apps/backend/.env.production    # Backend producción
```

### 🚀 Setup Rápido

#### Para Desarrollo Local:

```bash
# 1. Copiar templates
cp apps/frontend/.env.example apps/frontend/.env
cp apps/backend/.env.example apps/backend/.env

# 2. Editar si es necesario (opcional - funciona con defaults)
# Las configuraciones por defecto están optimizadas para desarrollo
```

#### Para Producción:

```bash
# 1. Copiar y renombrar
cp apps/frontend/.env.example apps/frontend/.env.production
cp apps/backend/.env.example apps/backend/.env.production

# 2. Configurar URLs de producción
# Editar VITE_API_URL en frontend/.env.production
# Editar CORS_ORIGIN en backend/.env.production
```

### 🔧 Variables Más Importantes

#### Frontend (apps/frontend/.env):
- `VITE_API_URL`: URL del backend (solo para producción)
- `VITE_ENABLE_DEVTOOLS`: React Query DevTools
- `VITE_QUERY_STALE_TIME`: Cache de datos

#### Backend (apps/backend/.env):
- `PORT`: Puerto del servidor (default: 3001)
- `CORS_ORIGIN`: URL del frontend permitida
- `SCRAPING_DELAY`: Delay entre requests
- `MAX_CONCURRENT_VALIDATIONS`: Validaciones simultáneas

### 🌍 Variables Opcionales

Las variables en `.env.example` del root son **OPCIONALES** y solo útiles para:
- Docker Compose
- Scripts globales
- CI/CD pipelines
- Herramientas de monitoreo

### 🔐 Seguridad

- ✅ Archivos `.env.example` están en Git (documentación)
- ❌ Archivos `.env` y `.env.production` están en `.gitignore`
- 🔒 Nunca commitear variables sensibles

### 🎯 Notas Importantes

1. **Desarrollo**: El proyecto funciona sin archivos `.env` (tiene defaults inteligentes)
2. **Producción**: Solo necesitas configurar `VITE_API_URL` y `CORS_ORIGIN`  
3. **Docker**: Usa variables del `.env.example` root si es necesario
4. **Testing**: Variables de testing están incluidas para futura expansión

### 🔗 Referencias

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Bun Environment Variables](https://bun.sh/docs/runtime/env)
- [Docker Compose Environment](https://docs.docker.com/compose/environment-variables/)

## 📁 Estructura de Configuración

```
scraper-proxies/
├── .env                           # Variables globales (opcional)
├── apps/backend/.env              # Variables del backend (opcional)
├── apps/frontend/.env             # Variables del frontend (opcional)
├── apps/backend/src/config/env.config.ts    # Configuración backend
├── apps/frontend/src/config/env.config.ts   # Configuración frontend
└── scripts/kill-ports.js         # Script para limpiar puertos
```

## 🔧 Variables del Backend

### Archivo: `apps/backend/.env`

```bash
# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# SSE (Server-Sent Events)
SSE_HEARTBEAT_INTERVAL=30000
SSE_CLIENT_TIMEOUT=60000

# Scraping
SCRAPING_DELAY=1000
MAX_CONCURRENT_SOURCES=4
REQUEST_TIMEOUT=10000

# Logging
LOG_LEVEL=info
MAX_LOGS=100
```

### Descripción de Variables Backend

| Variable | Descripción | Default | Ejemplo |
|----------|-------------|---------|---------|
| `PORT` | Puerto del servidor backend | `3001` | `3001` |
| `NODE_ENV` | Entorno de ejecución | `development` | `production` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:5173` | `https://mi-app.com` |
| `SSE_HEARTBEAT_INTERVAL` | Intervalo de heartbeat SSE (ms) | `30000` | `15000` |
| `SSE_CLIENT_TIMEOUT` | Timeout de cliente SSE (ms) | `60000` | `120000` |
| `SCRAPING_DELAY` | Delay entre requests (ms) | `1000` | `2000` |
| `MAX_CONCURRENT_SOURCES` | Fuentes simultáneas máximas | `4` | `2` |
| `REQUEST_TIMEOUT` | Timeout de requests (ms) | `10000` | `15000` |
| `LOG_LEVEL` | Nivel de logging | `info` | `debug` |
| `MAX_LOGS` | Máximo logs en memoria | `100` | `200` |

## 🎨 Variables del Frontend

### Archivo: `apps/frontend/.env`

```bash
# API
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT=30000

# SSE (Server-Sent Events)
VITE_SSE_AUTO_CONNECT=true
VITE_SSE_RETRY_DELAY=3000
VITE_SSE_MAX_RETRIES=10
VITE_SSE_HEARTBEAT_TIMEOUT=60000

# UI
VITE_ENABLE_DEVTOOLS=true
VITE_DEFAULT_PAGE_SIZE=20
VITE_AUTO_SCROLL_LOGS=false
```

### Descripción de Variables Frontend

| Variable | Descripción | Default | Ejemplo |
|----------|-------------|---------|---------|
| `VITE_API_URL` | URL base de la API | `http://localhost:3001` | `https://api.mi-app.com` |
| `VITE_API_TIMEOUT` | Timeout de API (ms) | `30000` | `60000` |
| `VITE_SSE_AUTO_CONNECT` | Auto-conectar SSE | `true` | `false` |
| `VITE_SSE_RETRY_DELAY` | Delay de reconexión SSE (ms) | `3000` | `5000` |
| `VITE_SSE_MAX_RETRIES` | Máximo reintentos SSE | `10` | `5` |
| `VITE_SSE_HEARTBEAT_TIMEOUT` | Timeout heartbeat SSE (ms) | `60000` | `30000` |
| `VITE_ENABLE_DEVTOOLS` | Habilitar React Query DevTools | `true` | `false` |
| `VITE_DEFAULT_PAGE_SIZE` | Elementos por página | `20` | `50` |
| `VITE_AUTO_SCROLL_LOGS` | Auto-scroll en logs | `false` | `true` |

## 🚀 Scripts de Desarrollo

### Limpiar Puertos

```bash
# Matar todos los puertos del proyecto
bun run kill-ports

# Matar puertos específicos
bun run kill-port 3001 5173

# Limpiar puertos y arrancar desarrollo
bun run dev:clean
```

### Comandos de Desarrollo

```bash
# Desarrollo normal
bun run dev

# Desarrollo con limpieza de puertos
bun run dev:clean

# Solo frontend
bun run dev:frontend

# Solo backend
bun run dev:backend
```

## 🌍 Configuración por Entorno

### Desarrollo Local

```bash
# Backend
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3001
VITE_ENABLE_DEVTOOLS=true
```

### Testing (Playwright)

```bash
# Backend para tests
PORT=3002
NODE_ENV=test
CORS_ORIGIN=http://localhost:5173

# Frontend para tests
VITE_API_URL=http://localhost:3002
VITE_ENABLE_DEVTOOLS=false
```

### Producción

```bash
# Backend
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
SCRAPING_DELAY=2000
MAX_CONCURRENT_SOURCES=2

# Frontend
VITE_API_URL=https://api.tu-dominio.com
VITE_ENABLE_DEVTOOLS=false
VITE_SSE_RETRY_DELAY=5000
```

## 🔍 Debugging de Configuración

### Backend

La configuración se imprime al iniciar el servidor:

```bash
🔧 Configuración del Backend:
   Puerto: 3001
   Entorno: development
   CORS Origin: http://localhost:5173
   SSE Heartbeat: 30000ms
   Scraping Delay: 1000ms
   Max Logs: 100
🌐 URLs disponibles:
   Health: http://localhost:3001/health
   API: http://localhost:3001/api
   SSE Stream: http://localhost:3001/api/events/stream
```

### Frontend

La configuración se imprime en la consola del navegador (solo en desarrollo):

```bash
🎨 Configuración del Frontend:
   API Base URL: http://localhost:3001
   Entorno: development
   DevTools: habilitado
   SSE Auto-connect: sí
   Page Size: 20
🌐 URLs de API:
   Health: http://localhost:3001/health
   SSE Stream: http://localhost:3001/api/events/stream
   Scraping: http://localhost:3001/api/scrape/direct
```

## ⚠️ Notas Importantes

1. **Archivos .env son opcionales**: El proyecto funciona sin ellos usando valores por defecto
2. **Variables VITE_**: Solo las variables que empiecen con `VITE_` son accesibles en el frontend
3. **Prioridad**: Variables de entorno > Valores por defecto
4. **Seguridad**: Nunca commitear archivos `.env` con datos sensibles
5. **Testing**: Playwright usa puerto 3002 para evitar conflictos

## 🛠️ Solución de Problemas

### Puerto Ocupado

```bash
# Limpiar todos los puertos
bun run kill-ports

# Verificar puertos específicos
netstat -ano | findstr :3001  # Windows
lsof -ti:3001                 # Unix/Linux/macOS
```

### CORS Errors

1. Verificar `CORS_ORIGIN` en backend
2. Asegurar que frontend usa la URL correcta
3. Revisar logs del backend para ver requests bloqueados

### SSE No Conecta

1. Verificar que `VITE_API_URL` apunta al backend correcto
2. Revisar configuración de SSE en frontend
3. Comprobar que el backend está corriendo

### Variables No Se Cargan

1. Verificar que el archivo `.env` está en la ubicación correcta
2. Reiniciar el servidor después de cambios en `.env`
3. Variables del frontend deben empezar con `VITE_` 