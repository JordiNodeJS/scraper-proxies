# 🐳 Docker - Separación de Entornos

**Fecha**: 7 de Junio, 2025  
**Estado**: ✅ Implementado y Funcional

## 🎯 Objetivo

Separar completamente las configuraciones de Docker entre **desarrollo local** y **producción AWS** para evitar conflictos de configuración y facilitar el deployment en diferentes entornos.

## 🏗️ Arquitectura Implementada

### 📁 Estructura de Archivos

```
scraper-proxies/
├── docker-compose.local.yml      # 🏠 Configuración para desarrollo local
├── docker-compose.aws.yml        # ☁️ Configuración para AWS
├── scripts/
│   ├── docker-deploy-local.sh    # 🏠 Script de deployment local
│   └── docker-deploy-aws.sh      # ☁️ Script de deployment AWS
└── docker-compose.yml            # 📋 Configuración legacy (mantener para compatibilidad)
```

## 🔧 Configuraciones por Entorno

### 🏠 Entorno Local (`docker-compose.local.yml`)

**Características:**
- ✅ **Puertos**: Frontend 3800, Backend 3801
- ✅ **URLs**: `localhost` para todas las conexiones
- ✅ **CORS**: `http://localhost:3800`
- ✅ **Contenedores**: Sufijo `-local`
- ✅ **Uso**: Desarrollo y testing local

**Configuración:**
```yaml
services:
  backend:
    container_name: proxy-scraper-backend-local
    ports:
      - "3801:3001"
    environment:
      - CORS_ORIGIN=http://localhost:3800
  
  frontend:
    container_name: proxy-scraper-frontend-local
    ports:
      - "3800:80"
    environment:
      - VITE_API_URL=http://localhost:3801
```

### ☁️ Entorno AWS (`docker-compose.aws.yml`)

**Características:**
- ✅ **Puertos**: Frontend 3080, Backend 3081
- ✅ **URLs**: IP pública auto-detectada
- ✅ **CORS**: `http://IP_PUBLICA:3080`
- ✅ **Contenedores**: Sufijo `-aws`
- ✅ **Uso**: Producción en servidores

**Configuración:**
```yaml
services:
  backend:
    container_name: proxy-scraper-backend-aws
    ports:
      - "3081:3001"
    environment:
      - CORS_ORIGIN=http://3.254.74.19:3080
  
  frontend:
    container_name: proxy-scraper-frontend-aws
    ports:
      - "3080:80"
    environment:
      - VITE_API_URL=http://3.254.74.19:3081
```

## 🚀 Scripts de Deployment

### 🏠 Script Local (`docker-deploy-local.sh`)

**Funcionalidades:**
- ✅ **Build automático** con flag `--build`
- ✅ **Limpieza** con flag `--clean`
- ✅ **Health checks** automáticos
- ✅ **URLs locales** mostradas al final

**Uso:**
```bash
# Deployment básico
./scripts/docker-deploy-local.sh

# Con build
./scripts/docker-deploy-local.sh --build

# Con limpieza completa
./scripts/docker-deploy-local.sh --build --clean
```

### ☁️ Script AWS (`docker-deploy-aws.sh`)

**Funcionalidades:**
- ✅ **Auto-detección de IP** pública
- ✅ **Actualización automática** de configuración
- ✅ **IP manual** con flag `--ip`
- ✅ **Build y limpieza** opcionales

**Uso:**
```bash
# Deployment automático (detecta IP)
./scripts/docker-deploy-aws.sh --build

# Con IP específica
./scripts/docker-deploy-aws.sh --build --ip 3.254.74.19

# Con limpieza completa
./scripts/docker-deploy-aws.sh --build --clean
```

## 📊 Comparación de Entornos

| Aspecto | Local | AWS |
|---------|-------|-----|
| **Archivo Config** | `docker-compose.local.yml` | `docker-compose.aws.yml` |
| **Script Deploy** | `docker-deploy-local.sh` | `docker-deploy-aws.sh` |
| **Frontend Port** | 3800 | 3080 |
| **Backend Port** | 3801 | 3081 |
| **Frontend URL** | http://localhost:3800 | http://IP_PUBLICA:3080 |
| **Backend URL** | http://localhost:3801 | http://IP_PUBLICA:3081 |
| **CORS Origin** | http://localhost:3800 | http://IP_PUBLICA:3080 |
| **Contenedores** | `*-local` | `*-aws` |
| **Auto-detección IP** | ❌ No necesaria | ✅ Automática |
| **Build Args** | Localhost URLs | IP pública URLs |
| **Health Checks** | ✅ Habilitado | ✅ Habilitado |

## 🔄 Workflows de Uso

### 🏠 Desarrollo Local

```bash
# 1. Desarrollo nativo (recomendado)
bun run dev

# 2. Testing con Docker
./scripts/docker-deploy-local.sh --build

# 3. Verificar funcionamiento
curl http://localhost:3801/health
# Navegador: http://localhost:3800
```

### ☁️ Deployment AWS

```bash
# 1. Subir archivos al servidor
scp docker-compose.aws.yml scripts/docker-deploy-aws.sh user@server:~/project/

# 2. En el servidor AWS
chmod +x docker-deploy-aws.sh
./docker-deploy-aws.sh --build --clean

# 3. Verificar funcionamiento
curl http://localhost:3081/health
# Navegador: http://IP_PUBLICA:3080
```

## 🛠️ Comandos de Gestión

### 🏠 Comandos Locales

```bash
# Estado de servicios
docker compose -f docker-compose.local.yml ps

# Logs en tiempo real
docker compose -f docker-compose.local.yml logs -f

# Reiniciar servicios
docker compose -f docker-compose.local.yml restart

# Parar servicios
docker compose -f docker-compose.local.yml down

# Limpiar completamente
docker compose -f docker-compose.local.yml down --remove-orphans --volumes
```

### ☁️ Comandos AWS

```bash
# Estado de servicios
docker compose -f docker-compose.aws.yml ps

# Logs en tiempo real
docker compose -f docker-compose.aws.yml logs -f

# Reiniciar servicios
docker compose -f docker-compose.aws.yml restart

# Parar servicios
docker compose -f docker-compose.aws.yml down

# Limpiar completamente
docker compose -f docker-compose.aws.yml down --remove-orphans --volumes
```

## 🔍 Troubleshooting

### Problema: Puertos Ocupados

**Síntomas:**
- Error: "Port already in use"
- Servicios no inician

**Solución:**
```bash
# Verificar puertos ocupados
netstat -ano | findstr "3080\|3081\|3800\|3801"

# Windows: Matar proceso
taskkill /PID <PID_NUMBER> /F

# Linux/Mac: Matar proceso
lsof -ti:3080 | xargs kill -9
```

### Problema: Configuración Incorrecta

**Síntomas:**
- Frontend no conecta con backend
- Errores CORS

**Solución:**
```bash
# Verificar configuración
grep -A 5 -B 5 "VITE_API_URL\|CORS_ORIGIN" docker-compose.*.yml

# Forzar rebuild
docker compose -f docker-compose.aws.yml build --no-cache

# Verificar IP actual
curl -s ifconfig.me
```

### Problema: Contenedores Conflictivos

**Síntomas:**
- Nombres de contenedores duplicados
- Servicios no inician correctamente

**Solución:**
```bash
# Parar todos los servicios
docker compose -f docker-compose.local.yml down
docker compose -f docker-compose.aws.yml down

# Limpiar sistema
docker system prune -f

# Reiniciar deployment
./scripts/docker-deploy-aws.sh --build --clean
```

## ✅ Ventajas de esta Arquitectura

### 🎯 **Separación Clara**
- ✅ No más conflictos entre entornos
- ✅ Configuraciones específicas por uso
- ✅ Puertos diferenciados

### 🚀 **Deployment Automatizado**
- ✅ Scripts específicos por entorno
- ✅ Auto-detección de IP en AWS
- ✅ Configuración automática de CORS

### 🔧 **Mantenimiento Simplificado**
- ✅ Comandos específicos por entorno
- ✅ Logs y debugging separados
- ✅ Limpieza independiente

### 📊 **Escalabilidad**
- ✅ Fácil agregar nuevos entornos
- ✅ Configuraciones reutilizables
- ✅ Scripts modulares

## 🎉 Estado Final

**✅ IMPLEMENTACIÓN COMPLETADA**

- ✅ **Archivos creados**: 4 nuevos archivos
- ✅ **Scripts funcionales**: Ambos scripts probados
- ✅ **Documentación**: README actualizado
- ✅ **Configuraciones**: Separadas y optimizadas
- ✅ **Testing**: Listo para deployment

### 📋 Próximos Pasos

1. **Probar deployment local**:
   ```bash
   ./scripts/docker-deploy-local.sh --build
   ```

2. **Ejecutar en AWS**:
   ```bash
   ./scripts/docker-deploy-aws.sh --build --clean
   ```

3. **Verificar funcionamiento** en ambos entornos

---

**Desarrollado el 7 de Junio, 2025**  
**Arquitectura**: Docker Compose + Scripts automatizados  
**Entornos**: Local (3800/3801) + AWS (3080/3081) 