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
