#!/bin/bash

# Generate SSL Certificate with Let's Encrypt
# Script para generar certificados SSL

set -e

SERVER_IP="3.254.74.19"
KEY_PATH="/g/DEV/AWS/monorepo.pem"

# Verificar que se proporcione un dominio
if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar un dominio"
    echo "Uso: $0 <dominio>"
    echo "Ejemplo: $0 mi-proxy-scraper.com"
    exit 1
fi

DOMAIN="$1"

echo "🔐 Generating SSL certificate for domain: $DOMAIN"

# Función para ejecutar comandos en el servidor remoto
run_remote() {
    ssh -i "$KEY_PATH" ubuntu@$SERVER_IP "$1"
}

echo "📋 Step 1: Updating nginx configuration with domain..."
run_remote "sudo sed -i 's/server_name .*/server_name $DOMAIN;/' /etc/nginx/sites-available/scraper-proxies"

echo "📋 Step 2: Testing nginx configuration..."
run_remote "sudo nginx -t"

echo "📋 Step 3: Reloading nginx..."
run_remote "sudo systemctl reload nginx"

echo "📋 Step 4: Generating SSL certificate with certbot..."
run_remote "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN"

echo "📋 Step 5: Testing SSL certificate..."
run_remote "sudo certbot certificates"

echo "📋 Step 6: Setting up auto-renewal..."
run_remote "sudo systemctl enable snap.certbot.renew.timer"
run_remote "sudo systemctl start snap.certbot.renew.timer"

echo "📋 Step 7: Testing auto-renewal..."
run_remote "sudo certbot renew --dry-run"

echo "✅ SSL certificate generated successfully!"
echo ""
echo "🌐 Your site is now available at:"
echo "   HTTP:  http://$DOMAIN"
echo "   HTTPS: https://$DOMAIN"
echo ""
echo "📋 SSL Certificate will auto-renew every 90 days"
echo "📋 You can check renewal status with:"
echo "   ssh -i $KEY_PATH ubuntu@$SERVER_IP 'sudo certbot certificates'" 