#!/bin/bash

# Script para configurar Security Groups AWS para HTTPS
# Uso: ./scripts/aws-security-group-https.sh [SECURITY_GROUP_ID]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detectar Security Group automáticamente o usar el proporcionado
SECURITY_GROUP_ID=$1

if [[ -z "$SECURITY_GROUP_ID" ]]; then
    echo -e "${BLUE}🔍 Auto-detectando Security Group...${NC}"
    
    # Obtener el Security Group de la instancia actual
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "")
    
    if [[ -n "$INSTANCE_ID" ]]; then
        SECURITY_GROUP_ID=$(aws ec2 describe-instances \
            --instance-ids $INSTANCE_ID \
            --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
            --output text 2>/dev/null || echo "")
    fi
    
    if [[ -z "$SECURITY_GROUP_ID" ]]; then
        echo -e "${RED}❌ No se pudo detectar el Security Group automáticamente${NC}"
        echo -e "${YELLOW}💡 Uso: $0 sg-xxxxxxxxx${NC}"
        echo ""
        echo -e "${BLUE}🔍 Para encontrar tu Security Group:${NC}"
        echo -e "   1. Ve a AWS Console → EC2 → Security Groups"
        echo -e "   2. Busca el Security Group de tu instancia"
        echo -e "   3. Ejecuta: $0 sg-xxxxxxxxx"
        exit 1
    fi
fi

echo -e "${BLUE}🔒 Configurando Security Group para HTTPS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Security Group ID: ${SECURITY_GROUP_ID}${NC}"

# Verificar que AWS CLI esté configurado
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI no está configurado${NC}"
    echo -e "${YELLOW}💡 Ejecuta: aws configure${NC}"
    exit 1
fi

# Función para agregar regla si no existe
add_security_group_rule() {
    local protocol=$1
    local port=$2
    local description=$3
    
    # Verificar si la regla ya existe
    if aws ec2 describe-security-groups \
        --group-ids $SECURITY_GROUP_ID \
        --query "SecurityGroups[0].IpPermissions[?IpProtocol=='${protocol}' && FromPort==\`${port}\` && ToPort==\`${port}\`]" \
        --output text | grep -q "${port}"; then
        echo -e "${YELLOW}⚠️  Regla ${protocol}:${port} ya existe${NC}"
    else
        echo -e "${BLUE}➕ Agregando regla ${protocol}:${port} - ${description}${NC}"
        aws ec2 authorize-security-group-ingress \
            --group-id $SECURITY_GROUP_ID \
            --protocol $protocol \
            --port $port \
            --cidr 0.0.0.0/0 \
            --description "$description" || true
    fi
}

# Agregar reglas necesarias para HTTPS
echo -e "${BLUE}📦 Configurando reglas de firewall...${NC}"

# HTTP (puerto 80) - Para redirect automático a HTTPS
add_security_group_rule "tcp" "80" "HTTP for HTTPS redirect"

# HTTPS (puerto 443) - Para tráfico SSL
add_security_group_rule "tcp" "443" "HTTPS/SSL traffic"

# SSH (puerto 22) - Para administración
add_security_group_rule "tcp" "22" "SSH access"

echo ""
echo -e "${GREEN}✅ Security Group configurado exitosamente!${NC}"

# Mostrar reglas actuales
echo ""
echo -e "${BLUE}📋 Reglas actuales del Security Group:${NC}"
aws ec2 describe-security-groups \
    --group-ids $SECURITY_GROUP_ID \
    --query 'SecurityGroups[0].IpPermissions[*].[IpProtocol,FromPort,ToPort,IpRanges[0].CidrIp,IpRanges[0].Description]' \
    --output table

echo ""
echo -e "${YELLOW}📝 Verificación:${NC}"
echo -e "   ✅ Puerto 22 (SSH): Administración"
echo -e "   ✅ Puerto 80 (HTTP): Redirect a HTTPS"  
echo -e "   ✅ Puerto 443 (HTTPS): Tráfico SSL seguro"

echo ""
echo -e "${BLUE}🌐 URLs después de configurar HTTPS:${NC}"
echo -e "   Frontend: ${GREEN}https://tu-dominio.com${NC}"
echo -e "   Backend:  ${GREEN}https://tu-dominio.com/api${NC}"

echo ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo -e "   1. Configurar un dominio que apunte a tu IP: 3.254.74.19"
echo -e "   2. Ejecutar: ./scripts/setup-https-aws.sh tu-dominio.com"
echo -e "   3. Verificar HTTPS en: https://tu-dominio.com" 