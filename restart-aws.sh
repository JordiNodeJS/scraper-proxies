#!/bin/bash
ssh -i /g/DEV/AWS/monorepo.pem ubuntu@ec2-3-254-74-19.eu-west-1.compute.amazonaws.com << 'EOF'
cd projects/scraper-proxies

echo "🔄 Actualizando código..."
git pull

echo "🛑 Deteniendo servicios..."
docker compose -f docker-compose.aws.yml down

echo "🔨 Reconstruyendo frontend con configuración TypeScript..."
docker compose -f docker-compose.aws.yml build --no-cache frontend

echo "🚀 Iniciando servicios..."
docker compose -f docker-compose.aws.yml up -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 15

echo "✅ Estado de servicios:"
docker compose -f docker-compose.aws.yml ps

echo "📋 Logs de configuración del backend:"
docker compose -f docker-compose.aws.yml logs backend | grep -A 20 "Configuración del Backend"

echo "🧪 Testing conectividad backend:"
curl -s http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081/health | head -1

echo "🧪 Testing CORS:"
curl -s -H "Origin: http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080" http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081/health | head -1

echo "🎉 Deploy completado!"
echo "Frontend: http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080"
echo "Backend:  http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081"
EOF 