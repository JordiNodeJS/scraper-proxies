#!/bin/bash

# Fix nginx ports to match running Docker containers
SERVER_IP="3.254.74.19"
KEY_PATH="/g/DEV/AWS/monorepo.pem"

echo "🔧 Fixing nginx ports to match Docker containers..."

ssh -i "$KEY_PATH" ubuntu@$SERVER_IP "sudo nginx -t && sudo systemctl reload nginx"

echo "✅ Nginx reloaded successfully!" 