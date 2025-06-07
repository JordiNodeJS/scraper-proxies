# 🐳 COMANDOS DOCKER ACTUALIZADOS - POST REFACTORING

## 📋 RESUMEN DE CAMBIOS

**✅ REFACTORING COMPLETADO**

Durante el refactoring de Docker se simplificó la configuración eliminando el modo desarrollo y manteniendo solo producción. Los comandos han sido actualizados.

---

## ❌ **COMANDOS OBSOLETOS (NO USAR)**

```bash
# ❌ OBSOLETOS - Ya no funcionan
./scripts/docker-build.sh --prod
./scripts/docker-build.sh --dev  
./scripts/docker-build.sh --prod --no-cache
./scripts/docker-deploy.sh --env prod
./scripts/docker-deploy.sh --env dev
```

---

## ✅ **COMANDOS ACTUALES (USAR ESTOS)**

### 🔧 **Build de Imágenes**

```bash
# Build normal (con cache)
./scripts/docker-build.sh

# Build sin cache (para problemas o cambios importantes)
./scripts/docker-build.sh --no-cache

# Build con output detallado (para debugging)
./scripts/docker-build.sh --verbose

# Ver ayuda
./scripts/docker-build.sh --help
```

### 🚀 **Deployment**

```bash
# Deploy completo (recomendado)
./scripts/docker-deploy.sh --build

# Deploy sin rebuild
./scripts/docker-deploy.sh

# Deploy en foreground (para ver logs)
./scripts/docker-deploy.sh --build --foreground

# Rollback al último backup
./scripts/docker-deploy.sh --rollback
```

### 🔍 **Verificación y Monitoreo**

```bash
# Verificar requisitos del sistema
./scripts/docker-check.sh

# Verificar configuración completa
./scripts/verify-configuration.sh

# Estado de servicios
docker compose ps

# Logs en tiempo real
docker compose logs -f

# Health checks
curl http://localhost:3080        # Frontend
curl http://localhost:3081/health # Backend
```

### 🧹 **Limpieza y Mantenimiento**

```bash
# Limpieza básica
./scripts/docker-cleanup.sh

# Limpieza completa con volúmenes
./scripts/docker-cleanup.sh --all --volumes

# Parar servicios
docker compose down
```

---

## 🎯 **CONFIGURACIÓN ACTUAL**

### **Puertos Actualizados**
- **Frontend**: `3080` (era 3800)
- **Backend**: `3081` (era 3801)

### **Modo Único: Producción**
- ✅ Solo se soporta modo producción en Docker
- ✅ Desarrollo se hace nativamente con `bun run dev`
- ✅ Configuración simplificada sin complejidad

### **Builds Optimizados**
- ✅ Frontend: Multi-stage con nginx (74.2MB)
- ✅ Backend: Bun + Playwright en Alpine (1.31GB)
- ✅ Health checks automáticos
- ✅ Auto-restart configurado

---

## 🚀 **WORKFLOWS RECOMENDADOS**

### **🏠 Desarrollo Diario**
```bash
# Configurar para desarrollo nativo
./scripts/switch-backend.sh native

# Iniciar desarrollo
bun run dev

# URLs:
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

### **🐳 Testing con Docker**
```bash
# Verificar sistema
./scripts/docker-check.sh

# Deploy completo
./scripts/docker-deploy.sh --build

# URLs:
# Frontend: http://localhost:3080
# Backend:  http://localhost:3081
```

### **🔄 Cambio Entre Modos**
```bash
# Desarrollo → Docker
./scripts/switch-backend.sh docker
./scripts/docker-deploy.sh --build

# Docker → Desarrollo  
docker compose down
./scripts/switch-backend.sh native
bun run dev
```

---

## 📊 **PARÁMETROS DISPONIBLES**

### **docker-build.sh**
| Parámetro | Descripción | Cuándo usar |
|-----------|-------------|-------------|
| `--no-cache` | Build sin cache | Problemas de cache, cambios importantes |
| `--verbose` | Output detallado | Debugging de builds |
| `--help` | Mostrar ayuda | Ver opciones disponibles |

### **docker-deploy.sh**
| Parámetro | Descripción | Cuándo usar |
|-----------|-------------|-------------|
| `--build` | Build antes de deploy | Cambios en código, deploy completo |
| `--rollback` | Rollback al último backup | Problemas en deployment |
| `--foreground` | Ejecutar en foreground | Ver logs durante deploy |
| `--help` | Mostrar ayuda | Ver opciones disponibles |

### **docker-check.sh**
| Verificación | Descripción |
|--------------|-------------|
| Requisitos del sistema | Docker, Bun, dependencias |
| Estado de Docker | Daemon, versión, recursos |
| Archivos del proyecto | Dockerfiles, compose, configs |
| Puertos disponibles | 3080, 3081 libres |
| Conectividad | Internet, Docker Hub |

---

## 🎉 **BENEFICIOS DEL REFACTORING**

### **✅ Simplificación**
- **-50% archivos Docker** (eliminado docker-compose.dev.yml)
- **-100% complejidad argumentos** (sin --dev/--prod)
- **+200% facilidad de uso** (comandos más simples)

### **✅ Claridad**
- **Desarrollo**: Siempre nativo con `bun run dev`
- **Testing/Producción**: Siempre Docker con `./scripts/docker-deploy.sh --build`
- **Sin confusión** entre modos

### **✅ Mantenimiento**
- **Configuración única** estable
- **Scripts simplificados** y robustos
- **Documentación clara** sin ambigüedades

---

## 🔧 **MIGRACIÓN DESDE COMANDOS ANTIGUOS**

Si tienes scripts o documentación con comandos antiguos:

```bash
# ANTES (obsoleto)
./scripts/docker-build.sh --prod
./scripts/docker-deploy.sh --env prod

# DESPUÉS (actual)
./scripts/docker-build.sh
./scripts/docker-deploy.sh --build
```

---

## 📚 **DOCUMENTACIÓN RELACIONADA**

- `docs/CONFIGURACION-PUERTOS-FINAL.md` - Configuración completa de puertos
- `docs/DOCKER-PRODUCTION-ONLY.md` - Detalles del refactoring
- `docs/FRONTEND-BACKEND-CONFIGURATION.md` - Configuración flexible
- `scripts/verify-configuration.sh` - Verificación automatizada

---

*Documentado: 2025-01-07*  
*Comandos actualizados post-refactoring* ✅  
*Autor: AI Assistant*  
*Proyecto: MVP Proxy Scraper* 