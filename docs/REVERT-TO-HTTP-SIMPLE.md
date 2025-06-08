# 🔄 Revertir a Configuración HTTP Simple

## 📋 Resumen

Este documento explica cómo revertir el MVP Proxy Scraper desde la configuración HTTPS complicada de vuelta a la configuración HTTP simple que funcionaba correctamente.

## 🎯 Objetivo

Volver a la configuración que funcionaba:
- **Frontend**: `http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080`
- **Backend**: `http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081`
- **Protocolo**: HTTP simple (sin nginx, sin SSL)

## ✅ Cambios Realizados Localmente

### 1. docker-compose.yml
- ✅ Eliminada configuración nginx/SSL
- ✅ Configuración HTTP simple en puertos 3080/3081
- ✅ CORS actualizado para HTTP

### 2. Backend (apps/backend/src/config/environments/production.config.ts)
- ✅ CORS simplificado solo para HTTP
- ✅ Eliminadas referencias HTTPS
- ✅ Origins actualizados a HTTP:3080

### 3. Frontend (apps/frontend/.env.production)
- ✅ VITE_API_URL actualizado a HTTP:3081
- ✅ Configuración limpia sin HTTPS

### 4. Script de Despliegue (scripts/deploy-http-simple.sh)
- ✅ Script automatizado para aplicar cambios
- ✅ Limpia configuraciones HTTPS anteriores
- ✅ Despliega configuración HTTP limpia

## 🚀 Pasos para Aplicar en el Servidor

### Opción 1: Script Automatizado (Recomendado)

```bash
# 1. Subir cambios al repositorio
git add .
git commit -m "Revert to HTTP simple configuration (ports 3080/3081)"
git push origin main

# 2. En el servidor AWS
ssh ubuntu@ec2-3-254-74-19.eu-west-1.compute.amazonaws.com
cd /home/ubuntu/projects/scraper-proxies

# 3. Actualizar código
git pull origin main

# 4. Ejecutar script de despliegue HTTP
chmod +x scripts/deploy-http-simple.sh
./scripts/deploy-http-simple.sh
```

### Opción 2: Pasos Manuales

```bash
# En el servidor AWS
ssh ubuntu@ec2-3-254-74-19.eu-west-1.compute.amazonaws.com
cd /home/ubuntu/projects/scraper-proxies

# 1. Parar servicios actuales
docker compose down --remove-orphans

# 2. Limpiar nginx/SSL si existe
sudo systemctl stop nginx || true
sudo systemctl disable nginx || true
sudo rm -rf /etc/nginx/sites-enabled/scraper-proxies || true

# 3. Limpiar imágenes Docker
docker system prune -f

# 4. Actualizar código
git pull origin main

# 5. Reconstruir y desplegar
docker compose build --no-cache
docker compose up -d

# 6. Verificar
docker compose ps
curl http://localhost:3080/
curl http://localhost:3081/health
```

## 🔍 Verificación Post-Despliegue

### URLs de Acceso:
- **Frontend**: http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080
- **Backend API**: http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081
- **Health Check**: http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081/health

### Tests de Verificación:
```bash
# Test desde servidor local
curl -f http://localhost:3080/
curl -f http://localhost:3081/health
curl -X POST http://localhost:3081/api/scrape/direct

# Test desde exterior
curl -f http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080/
curl -f http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081/health
```

### Logs de Monitoreo:
```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver logs específicos
docker compose logs frontend
docker compose logs backend

# Ver estado de contenedores
docker compose ps
```

## 🎯 Funcionalidades Esperadas Post-Revert

✅ **Frontend** cargando en puerto 3080  
✅ **Backend API** respondiendo en puerto 3081  
✅ **CORS** funcionando correctamente  
✅ **Scraping** funcionando sin errores 500  
✅ **SSE/Logs** en tiempo real  
✅ **Health checks** funcionando  

## 🔧 Troubleshooting

### Si el Frontend no carga:
```bash
docker compose logs frontend
# Verificar que nginx esté sirviendo en puerto 80 interno
```

### Si hay errores CORS:
```bash
docker compose logs backend
# Verificar que CORS_ORIGIN esté correctamente configurado
```

### Si el scraping falla:
```bash
# Verificar conectividad de red
curl -X POST http://localhost:3081/api/scrape/direct
# Revisar logs del backend para errores específicos
```

## ✅ Checklist de Validación

- [ ] Frontend accesible en :3080
- [ ] Backend accesible en :3081  
- [ ] Health check respondiendo
- [ ] APIs GET funcionando (/api/test)
- [ ] APIs POST funcionando (/api/scrape/direct)
- [ ] SSE/logs funcionando
- [ ] No errores CORS en logs
- [ ] Scraping de proxies exitoso

## 📝 Notas Importantes

1. **Puertos**: 3080 (frontend) y 3081 (backend) deben estar abiertos en AWS Security Groups
2. **Firewall**: Verificar que no haya bloqueos de firewall local
3. **DNS**: Usar IP directa si hay problemas con el hostname
4. **CORS**: La configuración debe permitir el origen exacto del frontend

---

**Resultado Esperado**: Sistema funcionando en HTTP simple como antes de implementar HTTPS. 