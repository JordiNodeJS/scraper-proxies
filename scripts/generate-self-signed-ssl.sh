#!/bin/bash

# Generate Self-Signed SSL Certificate for AWS EC2 hostname
# Script para generar certificados SSL auto-firmados

set -e

SERVER_IP="3.254.74.19"
KEY_PATH="/g/DEV/AWS/monorepo.pem"
HOSTNAME="ec2-3-254-74-19.eu-west-1.compute.amazonaws.com"

echo "🔐 Generating Self-Signed SSL Certificate for AWS EC2..."
echo "Hostname: $HOSTNAME"
echo ""

# Función para ejecutar comandos en el servidor remoto
run_remote() {
    ssh -i "$KEY_PATH" ubuntu@$SERVER_IP "$1"
}

echo "📋 Step 1: Creating SSL directory..."
run_remote "sudo mkdir -p /etc/ssl/private /etc/ssl/certs"

echo "📋 Step 2: Generating private key..."
run_remote "sudo openssl genrsa -out /etc/ssl/private/$HOSTNAME.key 2048"

echo "📋 Step 3: Creating certificate signing request..."
run_remote "sudo openssl req -new -key /etc/ssl/private/$HOSTNAME.key -out /etc/ssl/certs/$HOSTNAME.csr -subj '/C=ES/ST=Madrid/L=Madrid/O=Scraper Proxies/OU=Development/CN=$HOSTNAME'"

echo "📋 Step 4: Generating self-signed certificate..."
run_remote "sudo openssl x509 -req -days 365 -in /etc/ssl/certs/$HOSTNAME.csr -signkey /etc/ssl/private/$HOSTNAME.key -out /etc/ssl/certs/$HOSTNAME.crt"

echo "📋 Step 5: Setting proper permissions..."
run_remote "sudo chmod 600 /etc/ssl/private/$HOSTNAME.key"
run_remote "sudo chmod 644 /etc/ssl/certs/$HOSTNAME.crt"

echo "📋 Step 6: Creating SSL nginx configuration..."
run_remote "sudo tee /etc/nginx/sites-available/scraper-proxies-ssl > /dev/null << 'EOF'
server {
    listen 80;
    server_name $HOSTNAME;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name $HOSTNAME;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/$HOSTNAME.crt;
    ssl_certificate_key /etc/ssl/private/$HOSTNAME.key;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Proxy to frontend
    location / {
        proxy_pass http://localhost:3080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;
    }
    
    # Proxy to backend API
    location /api/ {
        proxy_pass http://localhost:3081;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;
    }
}
EOF"

echo "📋 Step 7: Enabling SSL site..."
run_remote "sudo ln -sf /etc/nginx/sites-available/scraper-proxies-ssl /etc/nginx/sites-enabled/"
run_remote "sudo rm -f /etc/nginx/sites-enabled/scraper-proxies"

echo "📋 Step 8: Testing nginx configuration..."
run_remote "sudo nginx -t"

echo "📋 Step 9: Reloading nginx..."
run_remote "sudo systemctl reload nginx"

echo "✅ Self-signed SSL certificate generated successfully!"
echo ""
echo "🌐 Your site is now available at:"
echo "   HTTP:  http://$HOSTNAME (redirects to HTTPS)"
echo "   HTTPS: https://$HOSTNAME"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "   - Browser will show security warning (expected for self-signed certificates)"
echo "   - Click 'Advanced' → 'Proceed to site' to access"
echo "   - For production, use a custom domain with Let's Encrypt"
echo ""
echo "📋 Certificate details:"
run_remote "sudo openssl x509 -in /etc/ssl/certs/$HOSTNAME.crt -text -noout | grep -E '(Subject|Issuer|Not After)'" 