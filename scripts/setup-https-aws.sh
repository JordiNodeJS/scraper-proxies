#!/bin/bash

# Script para configurar HTTPS con Let's Encrypt en AWS EC2
# Uso: ./scripts/setup-https-aws.sh your-domain.com

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN=$1

if [[ -z "$DOMAIN" ]]; then
    echo -e "${RED}❌ Error: Se requiere un dominio${NC}"
    echo -e "${YELLOW}💡 Uso: $0 your-domain.com${NC}"
    echo -e "${YELLOW}💡 Asegúrate de que el dominio apunte a la IP: 3.254.74.19${NC}"
    exit 1
fi

echo -e "${BLUE}🔒 Configurando HTTPS para ${DOMAIN}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# 1. Instalar Nginx y Certbot
echo -e "${BLUE}📦 Instalando Nginx y Certbot...${NC}"
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Configurar Nginx inicial (HTTP)
echo -e "${BLUE}🔧 Configurando Nginx...${NC}"
sudo tee /etc/nginx/sites-available/scraper-proxies << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend (React App)
    location / {
        proxy_pass http://localhost:3080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3081/health;
        access_log off;
    }
}
EOF

# 3. Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/scraper-proxies /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Test configuración Nginx
echo -e "${BLUE}🧪 Verificando configuración Nginx...${NC}"
sudo nginx -t

# 5. Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# 6. Verificar que el dominio resuelve
echo -e "${BLUE}🌐 Verificando resolución DNS...${NC}"
if ! nslookup ${DOMAIN} | grep -q "3.254.74.19"; then
    echo -e "${YELLOW}⚠️  Advertencia: El dominio ${DOMAIN} no parece apuntar a 3.254.74.19${NC}"
    echo -e "${YELLOW}💡 Asegúrate de configurar un registro A en tu DNS${NC}"
fi

# 7. Obtener certificado SSL
echo -e "${BLUE}🔒 Obteniendo certificado SSL de Let's Encrypt...${NC}"
sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} --redirect

# 8. Configurar renovación automática
echo -e "${BLUE}🔄 Configurando renovación automática...${NC}"
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# 9. Actualizar configuración Docker para HTTPS
echo -e "${BLUE}🐳 Actualizando configuración Docker para HTTPS...${NC}"
sed -i "s|http://3.254.74.19:3080|https://${DOMAIN}|g" docker-compose.aws.yml
sed -i "s|http://3.254.74.19:3081|https://${DOMAIN}/api|g" docker-compose.aws.yml

# 10. Reiniciar servicios Docker
echo -e "${BLUE}🔄 Reiniciando servicios Docker...${NC}"
docker compose -f docker-compose.aws.yml down
docker compose -f docker-compose.aws.yml up -d --build

# 11. Verificar HTTPS
echo -e "${BLUE}🧪 Verificando HTTPS...${NC}"
sleep 10

if curl -s -f https://${DOMAIN}/health > /dev/null; then
    echo -e "${GREEN}✅ HTTPS configurado exitosamente!${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS configurado, pero el servicio puede necesitar más tiempo${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Configuración HTTPS completada!${NC}"
echo ""
echo -e "${BLUE}📋 URLs HTTPS:${NC}"
echo -e "   Frontend: ${GREEN}https://${DOMAIN}${NC}"
echo -e "   Backend:  ${GREEN}https://${DOMAIN}/api${NC}"
echo -e "   Health:   ${GREEN}https://${DOMAIN}/health${NC}"

echo ""
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo -e "   1. Verificar que el dominio ${DOMAIN} apunte a 3.254.74.19"
echo -e "   2. Actualizar frontend para usar URLs HTTPS"
echo -e "   3. Configurar Security Groups para permitir puerto 443"

echo ""
echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo -e "   Ver certificados: ${GREEN}sudo certbot certificates${NC}"
echo -e "   Renovar manualmente: ${GREEN}sudo certbot renew${NC}"
echo -e "   Logs Nginx: ${GREEN}sudo tail -f /var/log/nginx/error.log${NC}" 