# 🐳 Docker Production Setup - MVP Proxy Scraper

## 📋 **Resumen**

Sistema Docker **simplificado solo para producción**. Se eliminó la complejidad del modo desarrollo para mayor estabilidad y facilidad de uso.

---

## 🚀 **Inicio Rápido**

### **Opción 1: Deploy Automatizado (Recomendado)**
```bash
./scripts/docker-deploy.sh --build
```

### **Opción 2: Manual**
```bash
# 1. Build imágenes
./scripts/docker-build.sh

# 2. Iniciar servicios
docker compose up -d

# 3. Verificar estado
docker compose ps
```

---

## 🏗️ **Arquitectura Simplificada**

### **Servicios (Solo 2)**
```
┌─────────────┐    ┌─────────────┐
│  Frontend   │    │   Backend   │
│   (nginx)   │◄──►│ (bun+express)│
│   :3000     │    │   :3001     │
└─────────────┘    └─────────────┘
```

| Servicio | Puerto | Descripción | Health Check |
|----------|--------|-------------|--------------|
| **Frontend** | 3000 | React + nginx | ✅ |
| **Backend** | 3001 | Bun + Express + Playwright | ✅ |

---

## 📊 **Comandos Principales**

### **🔧 Scripts Automatizados**
```bash
# Verificar requisitos del sistema
./scripts/docker-check.sh

# Build imágenes de producción
./scripts/docker-build.sh [--no-cache] [--verbose]

# Deploy completo
./scripts/docker-deploy.sh [--build] [--rollback] [--foreground]

# Limpiar sistema
./scripts/docker-cleanup.sh
```

### **🐳 Docker Compose**
```bash
# Iniciar servicios
docker compose up -d

# Ver estado
docker compose ps

# Ver logs
docker compose logs -f

# Parar servicios
docker compose down

# Reiniciar un servicio
docker compose restart backend
```

### **🔍 Monitoreo**
```bash
# Health checks manuales
curl http://localhost:3000/health  # Frontend
curl http://localhost:3001/health  # Backend

# Logs específicos
docker logs proxy-scraper-frontend
docker logs proxy-scraper-backend

# Métricas de recursos
docker stats
```

---

## 🌐 **URLs de Acceso**

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`
- **Health Checks**: 
  - Frontend: `http://localhost:3000/health`
  - Backend: `http://localhost:3001/health`

---

## ⚙️ **Configuración**

### **Variables de Entorno**
Archivo `.env` (se crea automáticamente desde `.env.example`):
```bash
# Backend
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:3001
```

### **Volúmenes Persistentes**
- `backend_logs`: Logs del backend
- Datos en memoria: Proxies y sesiones (no persistentes)

---

## 🔧 **Desarrollo Local**

Para desarrollo local, usa el sistema nativo (sin Docker):

```bash
# Terminal 1: Backend
cd apps/backend
bun run dev

# Terminal 2: Frontend  
cd apps/frontend
bun run dev

# URLs de desarrollo
# Frontend: http://localhost:5173 (con hot reload)
# Backend:  http://localhost:3001
```

---

## 🚨 **Troubleshooting**

### **Problemas Comunes**

#### **1. Puertos Ocupados**
```bash
# Verificar puertos
./scripts/docker-check.sh

# Liberar puertos
bun run kill-ports
```

#### **2. Servicios No Inician**
```bash
# Ver logs detallados
docker compose logs -f

# Recrear servicios
docker compose down
docker compose up -d --build
```

#### **3. Health Checks Fallan**
```bash
# Verificar manualmente
curl -v http://localhost:3001/health

# Reiniciar servicio específico
docker compose restart backend
```

#### **4. Problemas de Build**
```bash
# Build sin cache
./scripts/docker-build.sh --no-cache

# Limpiar sistema Docker
./scripts/docker-cleanup.sh --all
```

---

## 📈 **Beneficios de Solo Producción**

### **✅ Ventajas**
- **Simplicidad**: Sin configuraciones duales
- **Estabilidad**: Menos puntos de fallo
- **Performance**: Optimizado para producción
- **Mantenimiento**: Menos archivos que mantener
- **Testing**: Ambiente real de producción

### **📊 Métricas**
- **Servicios**: 2 (vs 3 con Redis)
- **Archivos config**: 1 (vs 2 con dev)
- **Startup time**: ~10s
- **Memory usage**: ~1.35GB
- **Build time**: ~2-3 minutos

---

## 🔄 **Workflow Recomendado**

### **Para Desarrollo Diario**
1. Usar sistema nativo con hot reload
2. Testing ocasional en Docker para validar producción

### **Para Testing/Staging**
```bash
./scripts/docker-deploy.sh --build
# Test en http://localhost:3000
```

### **Para Producción**
```bash
./scripts/docker-deploy.sh --build
# Deploy en servidor real
```

---

## 📚 **Archivos Importantes**

- `docker-compose.yml`: Configuración única de producción
- `scripts/docker-*.sh`: Scripts automatizados
- `Dockerfile`: Backend Bun + Playwright
- `apps/frontend/Dockerfile`: Frontend React + nginx
- `.env.example`: Template de variables

---

## ✅ **Conclusión**

El setup Docker simplificado proporciona:

- ✅ **Facilidad de uso**: Un solo comando para deploy
- ✅ **Estabilidad**: Configuración probada y estable
- ✅ **Escalabilidad**: Base sólida para crecimiento
- ✅ **Mantenimiento**: Menos complejidad operacional

Para desarrollo activo, usa el sistema nativo. Para testing y producción, usa Docker.

---

*Documentado: 2025-01-07*  
*Autor: AI Assistant*  
*Proyecto: MVP Proxy Scraper - Production Only Setup* 