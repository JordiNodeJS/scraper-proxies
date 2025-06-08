#!/bin/bash

# Setup SSL with Let's Encrypt for AWS Server
# Script para configurar SSL/TLS en el servidor AWS

set -e

SERVER_IP="3.254.74.19"
KEY_PATH="/g/DEV/AWS/monorepo.pem"
DOMAIN="your-domain.com"  # Cambiar por tu dominio real

echo "🔧 Setting up Let's Encrypt SSL on AWS Server..."

# Función para ejecutar comandos en el servidor remoto
run_remote() {
    ssh -i "$KEY_PATH" ubuntu@$SERVER_IP "$1"
}

echo "📋 Step 1: Creating certbot symlink..."
run_remote "sudo ln -sf /snap/bin/certbot /usr/bin/certbot"

echo "📋 Step 2: Testing certbot installation..."
run_remote "certbot --version"

echo "📋 Step 3: Creating nginx configuration for scraper-proxies..."
run_remote "sudo tee /etc/nginx/sites-available/scraper-proxies > /dev/null << 'EOF'
server {
    listen 80;
    server_name $SERVER_IP;  # Cambiar por tu dominio cuando lo tengas
    
    # Redirigir tráfico a los puertos de Docker
    location / {
        proxy_pass http://localhost:3800;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:3801;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
EOF"

echo "📋 Step 4: Enabling the site..."
run_remote "sudo ln -sf /etc/nginx/sites-available/scraper-proxies /etc/nginx/sites-enabled/"

echo "📋 Step 5: Disabling default site..."
run_remote "sudo rm -f /etc/nginx/sites-enabled/default"

echo "📋 Step 6: Testing nginx configuration..."
run_remote "sudo nginx -t"

echo "📋 Step 7: Reloading nginx..."
run_remote "sudo systemctl reload nginx"

echo "📋 Step 8: Creating web root for Let's Encrypt..."
run_remote "sudo mkdir -p /var/www/html/.well-known/acme-challenge"
run_remote "sudo chown -R www-data:www-data /var/www/html"

echo "✅ Basic nginx configuration completed!"
echo ""
echo "🚨 IMPORTANT NEXT STEPS:"
echo "1. Configure your domain DNS to point to $SERVER_IP"
echo "2. Update DOMAIN variable in this script with your real domain"
echo "3. Run SSL certificate generation with:"
echo "   ssh -i $KEY_PATH ubuntu@$SERVER_IP 'sudo certbot --nginx -d your-domain.com'"
echo ""
echo "📋 For testing with IP only (not recommended for production):"
echo "   ssh -i $KEY_PATH ubuntu@$SERVER_IP 'sudo certbot certonly --webroot -w /var/www/html -d $SERVER_IP'" 