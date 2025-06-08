#!/bin/bash

# Script para configurar ALB + ACM para HTTPS en AWS
# Uso: ./scripts/setup-alb-https.sh your-domain.com

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
    exit 1
fi

echo -e "${BLUE}⚡ Configurando ALB + ACM para ${DOMAIN}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Verificar AWS CLI
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI no está configurado${NC}"
    exit 1
fi

# Obtener información de la instancia actual
echo -e "${BLUE}🔍 Obteniendo información de la instancia...${NC}"
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
VPC_ID=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].VpcId' --output text)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[*].SubnetId' --output text)
AVAILABILITY_ZONES=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[*].AvailabilityZone' --output text | tr '\t' '\n' | sort -u | tr '\n' ' ')

echo -e "${YELLOW}VPC ID: ${VPC_ID}${NC}"
echo -e "${YELLOW}Instance ID: ${INSTANCE_ID}${NC}"

# 1. Crear Security Group para ALB
echo -e "${BLUE}🛡️ Creando Security Group para ALB...${NC}"
ALB_SG_ID=$(aws ec2 create-security-group \
    --group-name scraper-proxies-alb-sg \
    --description "Security Group for Scraper Proxies ALB" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=scraper-proxies-alb-sg" \
        --query 'SecurityGroups[0].GroupId' --output text)

# Agregar reglas al ALB Security Group
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp --port 80 --cidr 0.0.0.0/0 || true
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp --port 443 --cidr 0.0.0.0/0 || true

# 2. Solicitar certificado SSL en ACM
echo -e "${BLUE}🔒 Solicitando certificado SSL en ACM...${NC}"
CERT_ARN=$(aws acm request-certificate \
    --domain-name $DOMAIN \
    --validation-method DNS \
    --query 'CertificateArn' --output text)

echo -e "${YELLOW}Certificado ARN: ${CERT_ARN}${NC}"

# 3. Obtener registro DNS para validación
echo -e "${BLUE}📝 Obteniendo información de validación DNS...${NC}"
sleep 5  # Esperar que AWS procese la solicitud

VALIDATION_INFO=$(aws acm describe-certificate \
    --certificate-arn $CERT_ARN \
    --query 'Certificate.DomainValidationOptions[0]')

VALIDATION_NAME=$(echo $VALIDATION_INFO | jq -r '.ValidationDomain')
VALIDATION_VALUE=$(echo $VALIDATION_INFO | jq -r '.ValidationStatus')

echo -e "${YELLOW}⚠️  ACCIÓN REQUERIDA: Configurar validación DNS${NC}"
echo -e "${BLUE}Agrega este registro CNAME en tu DNS:${NC}"
echo -e "   Nombre: ${VALIDATION_NAME}"
echo -e "   Valor: ${VALIDATION_VALUE}"

echo ""
echo -e "${YELLOW}Presiona ENTER cuando hayas configurado el DNS...${NC}"
read

# 4. Esperar validación del certificado
echo -e "${BLUE}⏳ Esperando validación del certificado...${NC}"
aws acm wait certificate-validated --certificate-arn $CERT_ARN

# 5. Crear Target Group
echo -e "${BLUE}🎯 Creando Target Group...${NC}"
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name scraper-proxies-tg \
    --protocol HTTP \
    --port 3080 \
    --vpc-id $VPC_ID \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 2 \
    --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || \
    aws elbv2 describe-target-groups \
        --names scraper-proxies-tg \
        --query 'TargetGroups[0].TargetGroupArn' --output text)

# Registrar instancia en Target Group
aws elbv2 register-targets \
    --target-group-arn $TARGET_GROUP_ARN \
    --targets Id=$INSTANCE_ID

# 6. Crear Application Load Balancer
echo -e "${BLUE}⚡ Creando Application Load Balancer...${NC}"
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name scraper-proxies-alb \
    --subnets $SUBNET_IDS \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || \
    aws elbv2 describe-load-balancers \
        --names scraper-proxies-alb \
        --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Obtener DNS name del ALB
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' --output text)

# 7. Crear Listeners
echo -e "${BLUE}🔧 Configurando listeners...${NC}"

# HTTP Listener (redirect to HTTPS)
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
    > /dev/null 2>&1 || true

# HTTPS Listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=$CERT_ARN \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
    > /dev/null 2>&1 || true

echo ""
echo -e "${GREEN}✅ ALB + ACM configurado exitosamente!${NC}"

echo ""
echo -e "${BLUE}📋 Información del deployment:${NC}"
echo -e "   ALB DNS: ${GREEN}${ALB_DNS}${NC}"
echo -e "   Certificado: ${GREEN}${CERT_ARN}${NC}"
echo -e "   Target Group: ${GREEN}${TARGET_GROUP_ARN}${NC}"

echo ""
echo -e "${YELLOW}📝 Configuración DNS requerida:${NC}"
echo -e "   Crear registro CNAME: ${DOMAIN} → ${ALB_DNS}"
echo -e "   O registro A: ${DOMAIN} → IP del ALB"

echo ""
echo -e "${BLUE}🌐 URLs finales:${NC}"
echo -e "   Frontend: ${GREEN}https://${DOMAIN}${NC}"
echo -e "   Backend:  ${GREEN}https://${DOMAIN}/api${NC}"

echo ""
echo -e "${YELLOW}⏳ El ALB puede tardar 2-3 minutos en estar activo${NC}" 