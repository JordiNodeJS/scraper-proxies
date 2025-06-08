# P3-F6: Configuración HTTPS con Let's Encrypt + Nginx

## 📊 METADATA

- **Phase ID**: P3-F6
- **Feature**: HTTPS Configuration with Let's Encrypt + Nginx
- **Estimated Duration**: 2-3 horas
- **Priority**: HIGH
- **Dependencies**: AWS EC2 instance funcionando, dominio configurado
- **Status**: 🚧 IN PROGRESS
- **Created**: 2024-12-10
- **Last Updated**: 2024-12-10

## 🎯 OBJECTIVES

Migrar la aplicación Scraper Proxies de HTTP a HTTPS usando Let's Encrypt para certificados SSL gratuitos y Nginx como proxy reverso. Esto proporcionará:

1. **Comunicación segura** entre usuarios y la aplicación
2. **Certificados SSL automáticos** renovados cada 90 días
3. **Redirect automático** de HTTP a HTTPS
4. **Mejora en SEO** y confianza del usuario
5. **Compatibilidad con APIs modernas** que requieren HTTPS

## 📋 TASK BREAKDOWN

### Infraestructura AWS Tasks
- [ ] Configurar Security Groups para permitir puerto 443 (HTTPS)
- [ ] Configurar Security Groups para permitir puerto 80 (HTTP redirect)
- [ ] Verificar que el dominio apunte a la IP 3.254.74.19
- [ ] Backup de configuración actual de Docker

### Nginx Configuration Tasks
- [ ] Instalar Nginx en la instancia EC2
- [ ] Configurar proxy reverso para frontend (puerto 3080)
- [ ] Configurar proxy reverso para backend API (puerto 3081)
- [ ] Configurar headers de seguridad HTTP
- [ ] Setup de logs de acceso y errores

### Let's Encrypt SSL Tasks
- [ ] Instalar Certbot (Let's Encrypt client)
- [ ] Obtener certificado SSL para el dominio
- [ ] Configurar renovación automática con cron
- [ ] Verificar validez del certificado
- [ ] Setup de redirect HTTP → HTTPS

### Docker Integration Tasks
- [ ] Actualizar docker-compose.aws.yml con URLs HTTPS
- [ ] Modificar variables de entorno para HTTPS
- [ ] Actualizar configuración CORS para dominio HTTPS
- [ ] Restart de servicios Docker con nueva configuración

### Testing & Validation Tasks
- [ ] Verificar frontend accesible vía HTTPS
- [ ] Verificar backend API funcionando con HTTPS
- [ ] Test de health checks con SSL
- [ ] Verificar scraping real funciona con HTTPS
- [ ] Test de renovación automática de certificados

## ✅ ACCEPTANCE CRITERIA

- [ ] Aplicación completamente accesible vía https://dominio.com
- [ ] Backend API respondiendo en https://dominio.com/api/*
- [ ] Redirect automático de HTTP a HTTPS funcionando
- [ ] Certificado SSL válido con rating A en SSL Labs
- [ ] Health checks respondiendo correctamente
- [ ] Scraping de proxies funcionando sin errores SSL
- [ ] Renovación automática configurada y probada
- [ ] Sin downtime durante la migración
- [ ] Performance equivalente o mejor que HTTP

## 🔧 TECHNICAL SPECIFICATIONS

### Nginx Configuration
```nginx
# Proxy reverso para frontend y backend
# SSL termination en Nginx
# Headers de seguridad HSTS, CSP, etc.
# Rate limiting para API endpoints
```

### Let's Encrypt Setup
```bash
# Certbot con plugin nginx
# Certificados wildcard si es necesario
# Hooks para reload de nginx post-renovación
# Logs de renovación automática
```

### DNS Requirements
```bash
# Registro A: dominio.com → 3.254.74.19
# TTL: 300 segundos para cambios rápidos
# Propagación DNS verificada
```

### Security Headers
```nginx
# HSTS: Strict-Transport-Security
# CSP: Content-Security-Policy
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

## 📝 PROGRESS LOG

### 2024-12-10
- ✅ Scripts automatizados creados:
  - `scripts/setup-https-aws.sh` - Setup completo automatizado
  - `scripts/aws-security-group-https.sh` - Configuración Security Groups
  - `scripts/setup-alb-https.sh` - Alternativa con ALB
- ✅ Documentación completa en `docs/CONFIGURACION-HTTPS-AWS.md`
- ✅ Script específico para dominio AWS: `scripts/implementar-https-aws-domain.sh`
- ✅ Verificación de conectividad AWS exitosa:
  - Frontend: http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080 ✅
  - Backend: http://3.254.74.19:3081/health ✅
- ✅ Script de deployment generado: `deploy-https-to-aws.sh`
- 🚧 EJECUTANDO: Implementación HTTPS automática en servidor AWS

## 🚨 BLOCKERS & ISSUES

### Requisitos Previos
- [ ] **BLOCKER**: Necesitamos un dominio configurado apuntando a 3.254.74.19
- [ ] **BLOCKER**: AWS CLI configurado para Security Groups
- [ ] Verificar que el servidor AWS esté funcionando correctamente

### Consideraciones Técnicas
- Posible downtime durante configuración (< 5 minutos)
- Certificados Let's Encrypt requieren validación DNS
- Nginx puede interferir con puertos Docker existentes

## ✅ COMPLETION CHECKLIST

- [ ] Development completed
  - [ ] Scripts ejecutados exitosamente
  - [ ] Nginx configurado y funcionando
  - [ ] Certificados SSL obtenidos
- [ ] Testing completed
  - [ ] HTTPS endpoints verificados
  - [ ] Performance testing realizado
  - [ ] SSL Labs rating A obtenido
- [ ] Documentation updated
  - [ ] README actualizado con URLs HTTPS
  - [ ] Documentación de troubleshooting
- [ ] Code reviewed
  - [ ] Configuración Nginx revisada
  - [ ] Scripts de automatización validados
- [ ] Performance validated
  - [ ] Tiempo de respuesta < 200ms
  - [ ] Health checks < 100ms
  - [ ] Scraping sin degradación

---

## 🎯 IMPLEMENTATION PLAN

### Fase 1: Preparación (30 min)
1. Verificar dominio y DNS
2. Configurar Security Groups AWS
3. Backup de configuración actual

### Fase 2: Instalación (45 min)
1. Ejecutar `scripts/setup-https-aws.sh dominio.com`
2. Verificar instalación Nginx + Certbot
3. Obtener certificados SSL

### Fase 3: Configuración (30 min)
1. Configurar proxy reverso
2. Setup headers de seguridad
3. Configurar renovación automática

### Fase 4: Testing (45 min)
1. Verificar HTTPS endpoints
2. Test de funcionalidad completa
3. Performance testing
4. SSL Labs validation

**TOTAL ESTIMADO**: 2.5 horas 