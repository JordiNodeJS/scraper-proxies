# 🔧 Configuración Frontend-Backend Flexible

## 📋 **Resumen**

Sistema de configuración flexible que permite al frontend conectarse fácilmente entre backend nativo (desarrollo) y backend en Docker (producción) usando variables de entorno.

---

## 🎯 **Problema Solucionado**

Antes teníamos puertos hardcodeados en `vite.config.ts`, lo que requería cambios manuales de código para alternar entre:
- **Desarrollo nativo**: Backend en puerto 3001
- **Backend Docker**: Backend en puerto 3801

---

## ✅ **Solución Implementada**

### **1. Variables de Entorno**
- ✅ `VITE_BACKEND_PORT` - Puerto del backend para Vite proxy
- ✅ Configuración automática en `vite.config.ts`
- ✅ Fallback a puerto 3001 si no está definida

### **2. Script Automatizado**
- ✅ `./scripts/switch-backend.sh` - Cambio automático de configuración
- ✅ Backup automático de configuración anterior
- ✅ Configuraciones predefinidas para cada modo

### **3. Archivos de Configuración**
- ✅ `apps/frontend/.env` - Configuración activa
- ✅ `apps/frontend/.env.docker` - Template para Docker
- ✅ `apps/frontend/.env.example` - Documentación completa

---

## 🔄 **Modos de Configuración**

### **Modo 1: Backend Nativo (Desarrollo)**
```bash
# Configurar
./scripts/switch-backend.sh native

# URLs resultantes
Frontend: http://localhost:5173  # Vite dev server
Backend:  http://localhost:3001  # Express nativo

# Iniciar
bun run dev  # Ambos servicios
```

### **Modo 2: Backend Docker (Testing)**
```bash
# Configurar
./scripts/switch-backend.sh docker

# URLs resultantes
Frontend: http://localhost:5173  # Vite dev server
Backend:  http://localhost:3801  # Express en Docker

# Iniciar
./scripts/docker-deploy.sh --build  # Backend Docker
cd apps/frontend && bun run dev     # Frontend desarrollo
```

---

## 🔧 **Configuración Técnica**

### **vite.config.ts (Actualizado)**
```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Puerto del backend - usar variable de entorno o fallback
  const backendPort = env.VITE_BACKEND_PORT || env.BACKEND_PORT || '3001'
  const backendUrl = `http://localhost:${backendPort}`
  
  console.log(`🔧 Vite proxy configurado para backend: ${backendUrl}`)
  
  return {
    // ... configuración
    server: {
      proxy: {
        '/api': { target: backendUrl },
        '/health': { target: backendUrl }
      }
    }
  }
})
```

### **Variables de Entorno**
```bash
# apps/frontend/.env (Backend nativo)
VITE_BACKEND_PORT=3001

# apps/frontend/.env (Backend Docker)
VITE_BACKEND_PORT=3801
```

---

## 📊 **Comandos Disponibles**

### **Script Principal**
```bash
# Ver ayuda
./scripts/switch-backend.sh --help

# Configurar para backend nativo
./scripts/switch-backend.sh native

# Configurar para backend Docker
./scripts/switch-backend.sh docker
```

### **Verificación**
```bash
# Ver configuración actual
cat apps/frontend/.env | grep VITE_BACKEND_PORT

# Ver configuración de Vite (al iniciar frontend)
cd apps/frontend && bun run dev
# Output: 🔧 Vite proxy configurado para backend: http://localhost:XXXX
```

### **Backup y Restauración**
```bash
# Los backups se crean automáticamente
ls apps/frontend/.env.backup.*

# Restaurar backup manualmente
cp apps/frontend/.env.backup.YYYYMMDD_HHMMSS apps/frontend/.env
```

---

## 🌐 **Flujos de Trabajo**

### **Desarrollo Diario (Recomendado)**
```bash
# 1. Configurar para nativo
./scripts/switch-backend.sh native

# 2. Iniciar desarrollo
bun run dev

# URLs: Frontend 5173, Backend 3001
```

### **Testing con Docker**
```bash
# 1. Configurar para Docker
./scripts/switch-backend.sh docker

# 2. Iniciar backend Docker
./scripts/docker-deploy.sh --build

# 3. Iniciar frontend desarrollo
cd apps/frontend && bun run dev

# URLs: Frontend 5173, Backend 3801 (Docker)
```

### **Producción Completa Docker**
```bash
# Todo en Docker (sin configuración especial)
./scripts/docker-deploy.sh --build

# URLs: Frontend 3800, Backend 3801 (ambos Docker)
```

---

## 🔍 **Troubleshooting**

### **Error: "Failed to fetch"**
```bash
# 1. Verificar configuración
cat apps/frontend/.env | grep VITE_BACKEND_PORT

# 2. Verificar que el backend esté ejecutándose
curl http://localhost:3001/health  # Nativo
curl http://localhost:3801/health  # Docker

# 3. Reconfigurar si es necesario
./scripts/switch-backend.sh native   # o docker
```

### **Error: "Proxy error"**
```bash
# 1. Verificar logs de Vite (muestra URL del proxy)
cd apps/frontend && bun run dev

# 2. Cambiar configuración si el puerto es incorrecto
./scripts/switch-backend.sh [native|docker]
```

### **Configuración Mixta**
```bash
# Si tienes configuración inconsistente
./scripts/switch-backend.sh native  # Resetea a nativo
./scripts/switch-backend.sh docker  # O resetea a Docker
```

---

## 📈 **Beneficios**

### **✅ Flexibilidad**
- **Sin cambios de código**: Solo variables de entorno
- **Cambio rápido**: Un comando para alternar
- **Backup automático**: No perder configuración anterior

### **✅ Mantenibilidad**
- **Un solo lugar**: Puerto definido en variable
- **Documentación clara**: Cada modo bien explicado
- **Fallback seguro**: Puerto 3001 por defecto

### **✅ Experiencia de Desarrollo**
- **Workflow claro**: Scripts automatizados
- **Feedback visual**: Logs muestran configuración
- **Error recovery**: Fácil volver a configuración anterior

---

## 📚 **Archivos Relacionados**

### **Configuración**
- `apps/frontend/vite.config.ts` - Configuración dinámica
- `apps/frontend/.env` - Variables activas
- `apps/frontend/.env.example` - Documentación
- `apps/frontend/.env.docker` - Template Docker

### **Scripts**
- `scripts/switch-backend.sh` - Cambio de configuración
- `scripts/docker-deploy.sh` - Deploy Docker
- `scripts/docker-check.sh` - Verificación puertos

### **Documentación**
- `docs/DOCKER-PORTS-UPDATE.md` - Cambio de puertos
- `docs/DOCKER-PRODUCTION-ONLY.md` - Setup Docker
- `README.md` - Guía principal

---

## ✅ **Conclusión**

La configuración flexible permite:

- **🎯 Desarrollo eficiente**: Cambio rápido entre modos
- **🔧 Mantenimiento simple**: Variables en lugar de código
- **📖 Claridad**: Cada modo bien documentado
- **🚀 Escalabilidad**: Fácil agregar nuevos modos

El sistema elimina la necesidad de cambios manuales de código y proporciona una experiencia de desarrollo más fluida.

---

*Documentado: 2025-01-07*  
*Autor: AI Assistant*  
*Proyecto: MVP Proxy Scraper - Frontend-Backend Configuration* 