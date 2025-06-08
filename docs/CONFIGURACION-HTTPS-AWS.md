# 🔒 Configuración HTTPS para AWS - Scraper Proxies

**Fecha**: 10 de Diciembre, 2024  
**Estado**: ✅ Scripts Creados y Listos para Uso

## 🎯 Resumen Ejecutivo

Tu aplicación actualmente funciona en **HTTP** con la IP `3.254.74.19:3080/3081`. Esta guía proporciona **3 opciones** para migrar a **HTTPS** según tus necesidades y presupuesto.

### 📊 Comparación de Opciones

| Opción | Complejidad | Costo | Tiempo Setup | Escalabilidad |
|--------|-------------|-------|-------------|---------------|
| **Let's Encrypt + Nginx** | ⭐⭐ | 🆓 Gratis | 15 min | ⭐⭐ |
| **AWS ALB + ACM** | ⭐⭐⭐ | $16/mes | 30 min | ⭐⭐⭐⭐⭐ |
| **Cloudflare** | ⭐ | 🆓 Gratis | 5 min | ⭐⭐⭐⭐ |

## 🔒 Opción 1: Let's Encrypt + Nginx (RECOMENDADO)

### ✅ Ventajas
- **Gratuito** - Certificados SSL renovados automáticamente
- **Rápido** - 15 minutos de configuración
- **Simple** - Sin servicios adicionales de AWS
- **Directo** - Todo en tu instancia EC2 actual

### ❌ Desventajas
- Requiere dominio propio
- Certificado limitado a 90 días (auto-renovado)
- No escalable automáticamente

### 🚀 Implementación

#### Paso 1: Configurar Security Groups

```bash
# En tu máquina local (con AWS CLI configurado)
chmod +x scripts/aws-security-group-https.sh
./scripts/aws-security-group-https.sh

# O manualmente en AWS Console:
# 1. EC2 → Security Groups → Tu security group
# 2. Inbound Rules → Add Rule:
#    - Type: HTTP, Port: 80, Source: 0.0.0.0/0
#    - Type: HTTPS, Port: 443, Source: 0.0.0.0/0
```

#### Paso 2: Configurar Dominio

**Necesitas un dominio que apunte a tu IP AWS:**

```bash
# En tu proveedor DNS (Namecheap, GoDaddy, Route53, etc.)
# Crear registro A:
# Nombre: @ (o www)
# Tipo: A
# Valor: 3.254.74.19
# TTL: 300 (5 minutos)

# Verificar que el DNS propague:
nslookup tu-dominio.com
# Debe mostrar: 3.254.74.19
```

#### Paso 3: Ejecutar Setup Automático

```bash
# En tu servidor AWS (via SSH)
ssh -i tu-key.pem ubuntu@3.254.74.19

# Ejecutar script de configuración HTTPS
chmod +x scripts/setup-https-aws.sh
./scripts/setup-https-aws.sh tu-dominio.com

# El script hace automáticamente:
# ✅ Instala Nginx + Certbot
# ✅ Configura proxy reverso a tu app
# ✅ Obtiene certificado SSL de Let's Encrypt
# ✅ Configura redirect HTTP → HTTPS
# ✅ Programa renovación automática
# ✅ Actualiza configuración Docker
```

#### Paso 4: Verificación

```bash
# URLs finales:
https://tu-dominio.com          # Frontend
https://tu-dominio.com/api      # Backend API
https://tu-dominio.com/health   # Health Check

# Verificar certificado:
curl -I https://tu-dominio.com
# Debe mostrar: HTTP/2 200
```

### 🔧 Configuración Nginx Final

```nginx
# /etc/nginx/sites-available/scraper-proxies
server {
    listen 80;
    server_name tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    # SSL (auto-configurado por Certbot)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## ⚡ Opción 2: AWS Application Load Balancer + ACM

### ✅ Ventajas
- **Profesional** - Solución enterprise de AWS
- **Escalable** - Auto-scaling y high availability
- **Certificados gestionados** - AWS Certificate Manager
- **Monitoring avanzado** - CloudWatch integrado

### ❌ Desventajas
- **Costo**: ~$16/mes para ALB + datos
- **Complejo**: Configuración de múltiples servicios AWS
- **Over-engineering**: Para un MVP simple

### 🚀 Implementación

```bash
# En servidor AWS
chmod +x scripts/setup-alb-https.sh
./scripts/setup-alb-https.sh tu-dominio.com

# El script crea automáticamente:
# ✅ Application Load Balancer
# ✅ Target Group con tu instancia
# ✅ Certificado SSL en ACM
# ✅ Security Groups optimizados
# ✅ Listeners HTTP → HTTPS redirect
```

### 📊 Costos AWS ALB

| Recurso | Costo Mensual |
|---------|--------------|
| Application Load Balancer | $16.20 |
| Target Group | Gratis |
| Certificate Manager | Gratis |
| **Total** | **~$16.20/mes** |

---

## 🌐 Opción 3: Cloudflare (MÁS SIMPLE)

### ✅ Ventajas
- **Súper simple** - Solo configuración DNS
- **Gratuito** - Plan free incluye SSL
- **CDN incluido** - App más rápida globalmente
- **DDoS protection** - Seguridad automática
- **Sin cambios en servidor** - Todo funciona como está

### ❌ Desventajas
- Requiere cambiar nameservers del dominio
- SSL "Flexible" (no end-to-end en plan gratis)

### 🚀 Implementación

#### Paso 1: Crear cuenta Cloudflare

```bash
1. Ir a https://cloudflare.com
2. Crear cuenta gratuita
3. Agregar tu dominio
4. Cloudflare detectará automáticamente tus registros DNS
```

#### Paso 2: Configurar DNS

```bash
# En Cloudflare Dashboard → DNS → Records:
# Crear/verificar registro A:
# Name: @ (o www)
# IPv4: 3.254.74.19
# Proxy status: ✅ Proxied (nube naranja)
```

#### Paso 3: Cambiar Nameservers

```bash
# En tu proveedor de dominio (GoDaddy, Namecheap, etc.)
# Cambiar nameservers a los que Cloudflare proporciona:
# Ejemplo:
# ns1.cloudflare.com
# ns2.cloudflare.com
```

#### Paso 4: Configurar SSL

```bash
# En Cloudflare Dashboard → SSL/TLS:
# 1. Overview: Seleccionar "Flexible"
# 2. Edge Certificates: Habilitar "Always Use HTTPS"
# 3. Page Rules: Crear regla:
#    URL: http://*tu-dominio.com/*
#    Setting: Always Use HTTPS
```

#### Paso 5: Configurar Page Rules

```bash
# Cloudflare Dashboard → Rules → Page Rules:
# Crear regla para API:
# URL: tu-dominio.com/api/*
# Settings:
# - Cache Level: Bypass
# - Browser Cache TTL: Respect Existing Headers
```

### 🔄 Flujo Final con Cloudflare

```
Usuario → https://tu-dominio.com → Cloudflare CDN → http://3.254.74.19:3080
        └─ SSL termination en Cloudflare
```

---

## 🎯 Recomendación por Caso de Uso

### 🏠 **Para Desarrollo/Testing** → **Cloudflare**
- Setup en 5 minutos
- Gratis y funcional
- Fácil de revertir

### 🚀 **Para Producción Simple** → **Let's Encrypt + Nginx**
- Control completo
- Gratis y profesional
- End-to-end encryption

### 🏢 **Para Producción Enterprise** → **AWS ALB + ACM**
- Máxima escalabilidad
- Monitoring avanzado
- Integración AWS completa

---

## 🔧 Scripts Disponibles

| Script | Propósito | Uso |
|--------|-----------|-----|
| `aws-security-group-https.sh` | Configurar Security Groups | `./scripts/aws-security-group-https.sh` |
| `setup-https-aws.sh` | Let's Encrypt + Nginx | `./scripts/setup-https-aws.sh tu-dominio.com` |
| `setup-alb-https.sh` | AWS ALB + ACM | `./scripts/setup-alb-https.sh tu-dominio.com` |

---

## 🛠️ Troubleshooting

### Problema: Certificado no válido

```bash
# Verificar configuración Nginx
sudo nginx -t

# Ver logs de Certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Renovar certificado manualmente
sudo certbot renew --dry-run
```

### Problema: DNS no propaga

```bash
# Verificar desde múltiples ubicaciones
nslookup tu-dominio.com 8.8.8.8
nslookup tu-dominio.com 1.1.1.1

# Limpiar cache DNS local
sudo systemctl restart systemd-resolved
```

### Problema: Cloudflare loop infinito

```bash
# En Cloudflare → SSL/TLS → Overview
# Cambiar de "Flexible" a "Full"
# O deshabilitar "Always Use HTTPS" temporalmente
```

---

## 📋 Checklist de Migración HTTPS

### Antes de Empezar
- [ ] Dominio apunta a 3.254.74.19
- [ ] Security Groups permiten puerto 443
- [ ] Backup de configuración actual
- [ ] AWS CLI configurado (para ALB)

### Durante la Configuración
- [ ] Certificado SSL obtenido exitosamente
- [ ] Nginx/ALB configurado correctamente
- [ ] Redirect HTTP → HTTPS funciona
- [ ] APIs responden en HTTPS

### Después de HTTPS
- [ ] Frontend carga en https://tu-dominio.com
- [ ] Backend API funciona en https://tu-dominio.com/api
- [ ] Health check responde en https://tu-dominio.com/health
- [ ] Scraping real funciona con HTTPS
- [ ] Certificado se renueva automáticamente

---

## 🎉 Resultado Final

**URLs finales después de configurar HTTPS:**

```bash
# Frontend
https://tu-dominio.com

# Backend API
https://tu-dominio.com/api/health
https://tu-dominio.com/api/test
https://tu-dominio.com/api/scrape/direct

# Verificación SSL
https://www.ssllabs.com/ssltest/analyze.html?d=tu-dominio.com
```

---

**💡 Recomendación**: Para tu caso específico, sugiero empezar con **Cloudflare** para una implementación rápida, y luego migrar a **Let's Encrypt + Nginx** si necesitas más control. 