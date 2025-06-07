#!/bin/bash
ssh -i /g/DEV/AWS/monorepo.pem ubuntu@ec2-3-254-74-19.eu-west-1.compute.amazonaws.com << 'EOF'
cd projects/scraper-proxies
pwd
echo "🚀 Iniciando deploy en AWS..."
./docker-deploy-aws.sh --build --clean
EOF 