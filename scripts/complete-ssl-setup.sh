#!/bin/bash

# Complete SSL Setup - Manual Steps
# Script para completar la configuración SSL paso a paso

SERVER_IP="3.254.74.19"
KEY_PATH="/g/DEV/AWS/monorepo.pem"

echo "🔐 Completing SSL Setup for Scraper Proxies..."
echo "Server IP: $SERVER_IP"
echo ""

echo "📋 Step 1: Testing nginx configuration..."
ssh -i "$KEY_PATH" ubuntu@$SERVER_IP "sudo nginx -t"

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

echo ""
echo "📋 Step 2: Reloading nginx..."
ssh -i "$KEY_PATH" ubuntu@$SERVER_IP "sudo systemctl reload nginx"

echo "✅ Nginx reloaded"
echo ""

echo "📋 Step 3: Testing HTTP connection..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ HTTP connection working (Status: $HTTP_STATUS)"
else
    echo "⚠️  HTTP connection status: $HTTP_STATUS"
    echo "   This might be normal if containers are starting..."
fi

echo ""
echo "📋 Step 4: Checking Docker containers..."
ssh -i "$KEY_PATH" ubuntu@$SERVER_IP "docker compose ps"

echo ""
echo "🎯 NEXT STEPS:"
echo ""
echo "For HTTPS with a domain:"
echo "1. Configure your domain DNS: A record pointing to $SERVER_IP"
echo "2. Run: ./scripts/generate-ssl-cert.sh your-domain.com"
echo ""
echo "For testing with IP only:"
echo "1. Access: http://$SERVER_IP"
echo "2. Verify the frontend is loading correctly"
echo ""
echo "Manual SSL certificate generation (if you have a domain):"
echo "ssh -i $KEY_PATH ubuntu@$SERVER_IP 'sudo certbot --nginx -d your-domain.com'"
echo ""
echo "✅ SSL setup infrastructure is ready!" 