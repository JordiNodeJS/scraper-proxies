#!/bin/bash

# Script para implementar HTTPS con dominio AWS existente
# Uso: ./scripts/implementar-https-aws-domain.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

AWS_DOMAIN="ec2-3-254-74-19.eu-west-1.compute.amazonaws.com"
AWS_IP="3.254.74.19"

echo -e "${BLUE}🚀 IMPLEMENTANDO HTTPS CON DOMINIO AWS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Dominio: ${AWS_DOMAIN}${NC}"
echo -e "${YELLOW}IP AWS: ${AWS_IP}${NC}"
echo ""

# Verificar aplicación funcionando
echo -e "${BLUE}1. 🔍 Verificando aplicación actual...${NC}"
if curl -s --connect-timeout 10 "http://${AWS_DOMAIN}:3080" | grep -q "Scraper"; then
    echo -e "   ✅ Frontend funcionando en http://${AWS_DOMAIN}:3080"
else
    echo -e "   ⚠️  Frontend no responde, pero continuamos..."
fi

if curl -s --connect-timeout 10 "http://${AWS_IP}:3081/health" | grep -q "ok"; then
    echo -e "   ✅ Backend funcionando en http://${AWS_IP}:3081"
else
    echo -e "   ⚠️  Backend no responde, verificar en servidor"
fi

# Crear script de deployment para ejecutar en servidor
echo -e "${BLUE}2. 📝 Preparando configuración HTTPS...${NC}"

cat > deploy-https-to-aws.sh << 'EOF'
#!/bin/bash

# Script para ejecutar EN EL SERVIDOR AWS
# Implementa HTTPS automáticamente

set -e

AWS_DOMAIN="ec2-3-254-74-19.eu-west-1.compute.amazonaws.com"

echo "🔒 Configurando HTTPS para ${AWS_DOMAIN}..."

# 1. Backup configuración actual
echo "💾 Creando backup..."
cp docker-compose.aws.yml docker-compose.aws.yml.backup.$(date +%Y%m%d_%H%M%S)

# 2. Instalar Nginx y Certbot
echo "📦 Instalando Nginx y Certbot..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 3. Parar nginx por defecto para evitar conflictos
sudo systemctl stop nginx

# 4. Configurar Nginx para proxy reverso
echo "🔧 Configurando Nginx..."
sudo tee /etc/nginx/sites-available/scraper-proxies << 'NGINX_EOF'
server {
    listen 80;
    server_name ec2-3-254-74-19.eu-west-1.compute.amazonaws.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend (React App)
    location / {
        proxy_pass http://localhost:3080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3081/health;
        access_log off;
    }
}
NGINX_EOF

# 5. Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/scraper-proxies /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 6. Test configuración
sudo nginx -t

# 7. Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 8. Obtener certificado SSL (automático)
echo "🔒 Obteniendo certificado SSL..."
sudo certbot --nginx -d ${AWS_DOMAIN} --non-interactive --agree-tos --email admin@example.com --redirect

# 9. Configurar renovación automática
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# 10. Actualizar configuración Docker para HTTPS
echo "🐳 Actualizando configuración Docker..."
sed -i "s|http://3.254.74.19:3080|https://${AWS_DOMAIN}|g" docker-compose.aws.yml
sed -i "s|http://3.254.74.19:3081|https://${AWS_DOMAIN}/api|g" docker-compose.aws.yml

# 11. Reiniciar servicios Docker
echo "🔄 Reiniciando servicios..."
docker compose -f docker-compose.aws.yml down
docker compose -f docker-compose.aws.yml up -d

# 12. Verificar HTTPS
echo "🧪 Verificando HTTPS..."
sleep 15

if curl -s -f "https://${AWS_DOMAIN}/health" > /dev/null; then
    echo "✅ HTTPS configurado exitosamente!"
    echo ""
    echo "🌐 URLs HTTPS:"
    echo "   Frontend: https://${AWS_DOMAIN}"
    echo "   Backend:  https://${AWS_DOMAIN}/api"
    echo "   Health:   https://${AWS_DOMAIN}/health"
else
    echo "⚠️  HTTPS configurado, pero servicios necesitan más tiempo"
    echo "💡 Verificar manualmente en 2-3 minutos"
fi

echo ""
echo "🎉 HTTPS Implementation completada!"
EOF

chmod +x deploy-https-to-aws.sh

echo -e "   ✅ Script creado: deploy-https-to-aws.sh"

# Instrucciones de ejecución
echo ""
echo -e "${GREEN}🎯 SIGUIENTES PASOS - EJECUTAR EN SERVIDOR AWS:${NC}"
echo ""
echo -e "${YELLOW}1. Copiar script al servidor:${NC}"
echo -e "   ${GREEN}scp deploy-https-to-aws.sh ubuntu@${AWS_IP}:~/projects/scraper-proxies/${NC}"
echo ""
echo -e "${YELLOW}2. Conectar al servidor:${NC}"
echo -e "   ${GREEN}ssh -i tu-key.pem ubuntu@${AWS_IP}${NC}"
echo ""
echo -e "${YELLOW}3. Ejecutar en el servidor:${NC}"
echo -e "   ${GREEN}cd projects/scraper-proxies${NC}"
echo -e "   ${GREEN}chmod +x deploy-https-to-aws.sh${NC}"
echo -e "   ${GREEN}./deploy-https-to-aws.sh${NC}"
echo ""
echo -e "${YELLOW}4. URLs finales:${NC}"
echo -e "   Frontend: ${GREEN}https://${AWS_DOMAIN}${NC}"
echo -e "   Backend:  ${GREEN}https://${AWS_DOMAIN}/api${NC}"

echo ""
echo -e "${BLUE}⏱️  Tiempo estimado: 15-20 minutos${NC}"
echo -e "${BLUE}🔧 Downtime: < 2 minutos durante el switch${NC}"

echo ""
echo -e "${YELLOW}💡 ALTERNATIVA AUTOMÁTICA:${NC}"
echo -e "   Si tienes SSH key configurado, puedes ejecutar:"
echo -e "   ${GREEN}ssh -i tu-key.pem ubuntu@${AWS_IP} 'bash -s' < deploy-https-to-aws.sh${NC}" 