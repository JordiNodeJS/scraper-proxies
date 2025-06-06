# 🛠️ Guía Completa: Desarrollo y Producción

**Fecha**: 6 de Junio, 2025  
**Estado**: Documentación completa y probada  
**Versión**: 1.0.0  

## 🎯 Descripción General

Esta guía proporciona instrucciones detalladas para ejecutar el sistema de Scraper Proxies tanto en modo desarrollo como en producción, con ejemplos prácticos y solución de problemas.

## 🛠️ Modo Desarrollo

### Configuración Inicial

```bash
# 1. Clonar e instalar dependencias
git clone <repository-url>
cd scraper-proxies
bun install

# 2. Build de packages (solo primera vez)
bun run build:packages
```

### Métodos de Ejecución en Desarrollo

#### Método 1: Automático (Recomendado)

```bash
# Inicia frontend + backend simultáneamente
bun run dev

# Resultado esperado:
# ✅ Frontend: http://localhost:5173 (con hot reload)
# ✅ Backend: http://localhost:3001 (con auto-reload)
```

#### Método 2: Manual (Terminales Separadas)

```bash
# Terminal 1: Backend
bun run dev:backend
# Salida esperada:
# ✅ [SUCCESS] Backend server running on port 3001
# 📋 [INFO] Health check: http://localhost:3001/health

# Terminal 2: Frontend (nueva terminal)
bun run dev:frontend  
# Salida esperada:
# ➜ Local:   http://localhost:5173/
# ➜ Network: http://192.168.x.x:5173/
```

### URLs y Endpoints en Desarrollo

```bash
# Frontend principal
http://localhost:5173

# Backend APIs
http://localhost:3001/health          # Estado del servidor
http://localhost:3001/api/test        # Test de API
http://localhost:3001/api/stats       # Estadísticas
http://localhost:3001/api/config      # Configuración

# Test de scraping (mock data)
POST http://localhost:3001/api/scrape/test
```

### Características del Modo Desarrollo

- **Hot Reload**: Cambios instantáneos en el frontend
- **Auto-reload**: Reinicio automático del backend al cambiar código
- **Source Maps**: Debugging completo con líneas de código originales
- **Proxy integrado**: Frontend proxy hacia backend automáticamente
- **TypeScript**: Compilación incremental y checking en tiempo real

## 🚀 Modo Producción

### Preparación para Producción

```bash
# 1. Build completo del sistema
bun run build

# Resultado esperado:
# ✅ Packages compiled successfully
# ✅ Frontend build: 249.49 kB (gzipped: 76.39 kB)
# ✅ Backend: Configured for direct execution
```

### Métodos de Ejecución en Producción

#### Método 1: Automático Concurrente

```bash
# Inicia ambas aplicaciones optimizadas
bun run start

# URLs de acceso:
# Frontend: http://localhost:4174
# Backend:  http://localhost:3001
```

#### Método 2: Manual (Control Granular)

```bash
# Terminal 1: Backend en producción
bun run start:backend
# Salida esperada:
# ✅ [SUCCESS] Backend server running on port 3001
# 📋 [INFO] Environment: production

# Terminal 2: Frontend en modo preview
bun run start:frontend
# Salida esperada:
# ➜ Local:   http://localhost:4174/
# ➜ Network: http://192.168.x.x:4174/
```

#### Método 3: Script Automatizado con Verificaciones

```bash
# Script inteligente con checks de estado
bun run production

# Características:
# ✅ Verifica que los builds estén disponibles
# ✅ Detecta puertos ocupados
# ✅ Inicia aplicaciones en modo producción
# ✅ Proporciona URLs de acceso
```

### URLs y Endpoints en Producción

```bash
# Frontend optimizado (Vite Preview)
http://localhost:4174

# Backend directo (Bun Runtime)
http://localhost:3001/health          # Estado del servidor
http://localhost:3001/api/stats       # Estadísticas del sistema
http://localhost:3001/api/config      # Configuración actual
http://localhost:3001/api/logs        # Logs del sistema

# Scraping real
POST http://localhost:3001/api/scrape/direct
```

### Características del Modo Producción

- **Builds optimizadas**: Assets minificados y comprimidos
- **Performance**: Startup <5s, response time <100ms
- **Memory efficient**: Optimizado con Bun runtime
- **Error handling**: Logging robusto y manejo de errores
- **Health monitoring**: Checks automáticos de estado

## 📊 Comparación: Desarrollo vs Producción

| Aspecto | Desarrollo | Producción |
|---------|------------|-------------|
| **Frontend Port** | 5173 | 4174 |
| **Backend Port** | 3001 | 3001 |
| **Build Size** | No optimizado | 249.49 kB optimizado |
| **Startup Time** | ~3s | <5s |
| **Hot Reload** | ✅ Sí | ❌ No |
| **Source Maps** | ✅ Completos | ❌ Minificados |
| **Proxy Config** | ✅ Automático | ⚠️ Manual |
| **TypeScript** | ✅ Incremental | ✅ Pre-compilado |
| **Error Display** | 🔍 Detallado | 📝 Logged |

## 🔧 Comandos de Verificación

### Estado de Aplicaciones

```bash
# Verificar puertos activos
netstat -ano | findstr "3001\|4174\|5173"

# Test de conectividad
curl http://localhost:3001/health
curl http://localhost:3001/api/stats

# Verificar procesos
tasklist | findstr "bun\|vite\|node"
```

### Logs y Debugging

```bash
# Logs del backend
curl http://localhost:3001/api/logs?limit=50

# Configuración actual
curl http://localhost:3001/api/config

# Estadísticas del sistema
curl http://localhost:3001/api/stats
```

## 🚨 Solución de Problemas

### Problemas Comunes en Desarrollo

#### Puerto 5173 ocupado
```bash
# Solución: Cambiar puerto
cd apps/frontend
bun run dev --port 5174
```

#### Backend no inicia
```bash
# Verificar puerto 3001
netstat -ano | findstr ":3001"

# Matar proceso si existe
taskkill /PID <PID> /F

# Reiniciar backend
bun run dev:backend
```

#### Proxy errors en frontend
```bash
# Verificar configuración en vite.config.ts
# Debe tener proxy hacia localhost:3001
```

### Problemas Comunes en Producción

#### Build falla
```bash
# Limpiar y rebuildar
bun run clean
bun install
bun run build
```

#### Frontend no conecta con backend
```bash
# En producción, configurar reverse proxy o CORS
# Verificar que ambos servicios estén activos
curl http://localhost:3001/health
curl http://localhost:4174/
```

#### Memoria o performance
```bash
# Verificar recursos
tasklist | findstr "bun"
# Restart servicios si es necesario
```

## 🎯 Mejores Prácticas

### Para Desarrollo

1. **Usar terminales separadas** para mejor control
2. **Verificar logs regularmente** para detectar errores temprano
3. **Testear en ambos puertos** (5173 y 3001) regularmente
4. **Commits frecuentes** antes de cambios mayores

### Para Producción

1. **Siempre hacer build completo** antes de deploy
2. **Verificar health checks** después del inicio
3. **Monitorear logs** para detectar problemas
4. **Backup de configuraciones** antes de cambios

### Scripts Útiles Personalizados

```bash
# Crear alias para comandos frecuentes
alias dev-start="cd /path/to/scraper-proxies && bun run dev"
alias prod-start="cd /path/to/scraper-proxies && bun run build && bun run start"
alias check-status="netstat -ano | findstr '3001\|4174\|5173'"
```

## 📋 Checklist de Deployment

### Pre-Deploy
- [ ] Código committed y pushed
- [ ] Tests pasando
- [ ] Build completo exitoso
- [ ] Dependencies actualizadas

### Deploy
- [ ] Build de producción generado
- [ ] Backend iniciado correctamente
- [ ] Frontend iniciado correctamente
- [ ] Health checks pasando

### Post-Deploy
- [ ] URLs accesibles
- [ ] APIs respondiendo
- [ ] Logs sin errores críticos
- [ ] Performance dentro de parámetros

---

**📝 Nota**: Esta guía se actualiza regularmente. Para problemas específicos, consultar los logs del sistema o crear un issue en el repositorio. 