# Configuración SSL con Let's Encrypt en AWS

## 📋 Estado Actual

✅ **COMPLETADO:**
- Certbot 4.0.0 instalado via snap
- Nginx configurado como reverse proxy
- Configuración base para scraper-proxies
- Scripts automatizados creados

🚧 **PENDIENTE:**
- Recargar nginx con configuración corregida
- Configurar dominio real (opcional)
- Generar certificados SSL

## 🔧 Arquitectura Implementada

```
Internet → Nginx (Puerto 80/443) → Docker Containers
                    ↓
    Frontend: localhost:3080 (React)
    Backend:  localhost:3081 (Express + Bun)
```

## 📂 Archivos Creados

### Scripts de Automatización

1. **`scripts/setup-ssl.sh`**
   - Configuración inicial de nginx
   - Creación de configuración de proxy reverso
   - Preparación para Let's Encrypt

2. **`scripts/generate-ssl-cert.sh`**
   - Generación de certificados SSL
   - Configuración automática de HTTPS
   - Setup de auto-renovación

3. **`scripts/fix-nginx-ports.sh`**
   - Corrección de puertos nginx
   - Recarga de configuración

### Configuración Nginx

**Archivo:** `/etc/nginx/sites-available/scraper-proxies`

```nginx
server {
    listen 80;
    server_name 3.254.74.19;  # Cambiar por dominio real
    
    # Proxy al frontend React
    location / {
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy al backend API
    location /api/ {
        proxy_pass http://localhost:3081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
```

## 🚀 Pasos Siguientes

### Opción A: Con Dominio Propio (Recomendado)

1. **Configurar DNS:**
   ```bash
   # Apuntar tu dominio a la IP del servidor
   A record: tu-dominio.com → 3.254.74.19
   ```

2. **Generar certificado SSL:**
   ```bash
   ./scripts/generate-ssl-cert.sh tu-dominio.com
   ```

3. **Verificar HTTPS:**
   ```bash
   curl -I https://tu-dominio.com
   ```

### Opción B: Solo con IP (Para Testing)

1. **Conectar al servidor:**
   ```bash
   ssh -i /g/DEV/AWS/monorepo.pem ubuntu@3.254.74.19
   ```

2. **Recargar nginx manualmente:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Verificar funcionamiento:**
   ```bash
   curl -I http://3.254.74.19
   # Debería devolver 200 OK en lugar de 502
   ```

## 🔍 Troubleshooting

### Error 502 Bad Gateway

**Causa:** Nginx no puede conectar con los containers Docker

**Solución:**
```bash
# 1. Verificar containers
ssh -i /g/DEV/AWS/monorepo.pem ubuntu@3.254.74.19 "docker compose ps"

# 2. Verificar configuración nginx
ssh -i /g/DEV/AWS/monorepo.pem ubuntu@3.254.74.19 "sudo nginx -t"

# 3. Recargar nginx
ssh -i /g/DEV/AWS/monorepo.pem ubuntu@3.254.74.19 "sudo systemctl reload nginx"
```

### Certificado SSL No Generado

**Requisitos previos:**
- Dominio debe apuntar a la IP del servidor
- Puerto 80 debe estar accesible
- Nginx debe estar funcionando correctamente

## 📊 Comandos de Verificación

```bash
# Verificar estado nginx
ssh -i /g/DEV/AWS/monorepo.pem ubuntu@3.254.74.19 "sudo systemctl status nginx"

# Verificar containers Docker
ssh -i /g/DEV/AWS/monorepo.pem ubuntu@3.254.74.19 "docker compose ps"

# Verificar certificados SSL
ssh -i /g/DEV/AWS/monorepo.pem ubuntu@3.254.74.19 "sudo certbot certificates"

# Test de conectividad
curl -I http://3.254.74.19
curl -I https://tu-dominio.com  # Con dominio configurado
```

## 🔐 Seguridad

### Certificados Auto-Renovables

Los certificados se renuevan automáticamente cada 90 días:

```bash
# Verificar timer de renovación
sudo systemctl status snap.certbot.renew.timer

# Test manual de renovación
sudo certbot renew --dry-run
```

### Configuración HTTPS Final

Una vez generado el certificado, nginx automáticamente configurará:

- Redirección HTTP → HTTPS
- Configuración SSL segura
- Certificados válidos por 90 días

## 📝 Logs y Monitoreo

```bash
# Logs nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs certbot
sudo journalctl -u snap.certbot.renew.service

# Estado containers
docker compose logs --tail=50
```

## ✅ Checklist de Configuración

- [x] Certbot instalado
- [x] Nginx configurado como reverse proxy
- [x] Scripts de automatización creados
- [ ] Nginx recargado con configuración correcta
- [ ] Dominio DNS configurado (opcional)
- [ ] Certificado SSL generado
- [ ] HTTPS funcionando
- [ ] Auto-renovación configurada

---

**Próximo paso:** Recargar nginx manualmente o configurar dominio real para generar certificados SSL. 