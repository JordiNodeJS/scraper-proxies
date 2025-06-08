# 🚀 INSTRUCCIONES EJECUCIÓN HTTPS - AWS

**Fecha**: 10 de Diciembre, 2024  
**Dominio**: ec2-3-254-74-19.eu-west-1.compute.amazonaws.com  
**Tiempo estimado**: 15-20 minutos

## 🎯 MÉTODOS DE EJECUCIÓN

### **🔧 MÉTODO 1: Transferir y Ejecutar (Recomendado)**

#### Paso 1: Transferir script al servidor
```bash
# Desde tu máquina local (Git Bash)
scp deploy-https-to-aws.sh ubuntu@3.254.74.19:~/projects/scraper-proxies/
```

#### Paso 2: Conectar al servidor
```bash
ssh -i tu-key.pem ubuntu@3.254.74.19
```

#### Paso 3: Ejecutar en el servidor
```bash
cd projects/scraper-proxies
chmod +x deploy-https-to-aws.sh
./deploy-https-to-aws.sh
```

---

### **⚡ MÉTODO 2: Ejecución Directa (Automática)**

```bash
# Desde tu máquina local - ejecuta todo remotamente
ssh -i tu-key.pem ubuntu@3.254.74.19 'bash -s' < deploy-https-to-aws.sh
```

---

### **📝 MÉTODO 3: Copiar y Pegar Manual**

1. **Conectar al servidor:**
   ```bash
   ssh -i tu-key.pem ubuntu@3.254.74.19
   cd projects/scraper-proxies
   ```

2. **Crear el script:**
   ```bash
   nano setup-https.sh
   ```

3. **Pegar el contenido del script** (ver deploy-https-to-aws.sh)

4. **Ejecutar:**
   ```bash
   chmod +x setup-https.sh
   ./setup-https.sh
   ```

## 🔍 QUE HACE EL SCRIPT

### **Instalación y Configuración (5 min)**
1. ✅ Backup de configuración actual
2. ✅ Instala Nginx + Certbot
3. ✅ Configura proxy reverso para puertos 3080/3081

### **Certificados SSL (5 min)**
4. ✅ Obtiene certificado Let's Encrypt automáticamente
5. ✅ Configura renovación automática (cada 90 días)
6. ✅ Setup redirect HTTP → HTTPS

### **Integración Docker (5 min)**
7. ✅ Actualiza docker-compose.aws.yml con URLs HTTPS
8. ✅ Reinicia servicios Docker
9. ✅ Verifica funcionamiento HTTPS

## 📊 PROGRESO ESPERADO

```
🔒 Configurando HTTPS para ec2-3-254-74-19.eu-west-1.compute.amazonaws.com...
💾 Creando backup...
📦 Instalando Nginx y Certbot...
🔧 Configurando Nginx...
🔒 Obteniendo certificado SSL...
🐳 Actualizando configuración Docker...
🔄 Reiniciando servicios...
🧪 Verificando HTTPS...
✅ HTTPS configurado exitosamente!

🌐 URLs HTTPS:
   Frontend: https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com
   Backend:  https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com/api
   Health:   https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com/health

🎉 HTTPS Implementation completada!
```

## 🚨 TROUBLESHOOTING

### Si el script falla:

**Error de puertos:**
```bash
# Verificar que no haya conflictos
sudo netstat -tlnp | grep ':80\|:443'
sudo systemctl stop apache2  # Si está instalado
```

**Error de certificados:**
```bash
# Limpiar certificados anteriores
sudo certbot delete --cert-name ec2-3-254-74-19.eu-west-1.compute.amazonaws.com
```

**Error de Docker:**
```bash
# Verificar servicios Docker
docker compose -f docker-compose.aws.yml ps
docker compose -f docker-compose.aws.yml logs
```

### Verificación post-instalación:

```bash
# 1. Verificar Nginx
sudo systemctl status nginx

# 2. Verificar certificados
sudo certbot certificates

# 3. Test HTTPS
curl -I https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com/health

# 4. Test redirect HTTP → HTTPS
curl -I http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com
```

## ✅ RESULTADO FINAL

**URLs finales después de la implementación:**

- 🌐 **Frontend**: https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com
- 🔧 **Backend API**: https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com/api
- 💓 **Health Check**: https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com/health

**Certificado SSL:**
- 🔒 **Proveedor**: Let's Encrypt
- 🔄 **Renovación**: Automática cada 90 días
- ⭐ **Rating esperado**: A en SSL Labs

---

**💡 NOTA**: El proceso es completamente automático. Solo necesitas ejecutar el script y esperar ~15-20 minutos. 