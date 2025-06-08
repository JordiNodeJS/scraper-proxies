#!/bin/bash

# Script de Checklist Pre-HTTPS para AWS
# Uso: ./scripts/pre-https-checklist.sh [dominio.com]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN=$1

echo -e "${BLUE}🔍 CHECKLIST PRE-HTTPS - MVP Proxy Scraper${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

if [[ -n "$DOMAIN" ]]; then
    echo -e "${YELLOW}Dominio proporcionado: ${DOMAIN}${NC}"
else
    echo -e "${YELLOW}ℹ️  No se proporcionó dominio - checks generales únicamente${NC}"
fi

echo ""

# 1. Verificar conectividad AWS
echo -e "${BLUE}1. 🌐 Verificando conectividad AWS...${NC}"
if curl -s --connect-timeout 5 http://3.254.74.19:3080 > /dev/null; then
    echo -e "   ✅ Frontend AWS (puerto 3080) - ACCESIBLE"
else
    echo -e "   ❌ Frontend AWS (puerto 3080) - NO ACCESIBLE"
fi

if curl -s --connect-timeout 5 http://3.254.74.19:3081/health > /dev/null; then
    echo -e "   ✅ Backend AWS (puerto 3081) - FUNCIONANDO"
else
    echo -e "   ❌ Backend AWS (puerto 3081) - NO RESPONDE"
fi

# 2. Verificar servicios Docker
echo ""
echo -e "${BLUE}2. 🐳 Verificando servicios Docker en AWS...${NC}"
echo -e "   💡 Ejecutar en servidor AWS: docker compose -f docker-compose.aws.yml ps"

# 3. Verificar DNS si se proporcionó dominio
if [[ -n "$DOMAIN" ]]; then
    echo ""
    echo -e "${BLUE}3. 🌐 Verificando configuración DNS...${NC}"
    
    # Verificar resolución DNS
    DNS_IP=$(nslookup $DOMAIN 8.8.8.8 2>/dev/null | grep -A1 "Name:" | grep "Address:" | tail -1 | awk '{print $2}' || echo "NO_RESUELVE")
    
    if [[ "$DNS_IP" == "3.254.74.19" ]]; then
        echo -e "   ✅ DNS correcto: ${DOMAIN} → 3.254.74.19"
    elif [[ "$DNS_IP" == "NO_RESUELVE" ]]; then
        echo -e "   ❌ DNS no resuelve: ${DOMAIN}"
        echo -e "   💡 Configurar registro A: ${DOMAIN} → 3.254.74.19"
    else
        echo -e "   ⚠️  DNS incorrecto: ${DOMAIN} → ${DNS_IP}"
        echo -e "   💡 Debe apuntar a: 3.254.74.19"
    fi
    
    # Verificar propagación desde múltiples DNS
    echo -e "   🔍 Verificando propagación DNS..."
    
    for dns_server in "1.1.1.1" "8.8.8.8"; do
        result=$(nslookup $DOMAIN $dns_server 2>/dev/null | grep -A1 "Name:" | grep "Address:" | tail -1 | awk '{print $2}' || echo "NO_RESUELVE")
        if [[ "$result" == "3.254.74.19" ]]; then
            echo -e "   ✅ DNS Server ${dns_server}: Correcto"
        else
            echo -e "   ⚠️  DNS Server ${dns_server}: ${result}"
        fi
    done
else
    echo ""
    echo -e "${BLUE}3. 🌐 Configuración DNS${NC}"
    echo -e "   ⚠️  Dominio no proporcionado"
    echo -e "   💡 Para configurar HTTPS necesitas:"
    echo -e "      • Un dominio (ej: mi-app.com)"
    echo -e "      • Registro A: dominio → 3.254.74.19"
    echo -e "      • TTL: 300 segundos"
fi

# 4. Verificar puertos en Security Groups
echo ""
echo -e "${BLUE}4. 🛡️  Verificando Security Groups AWS...${NC}"
echo -e "   📋 Puertos necesarios para HTTPS:"
echo -e "      • Puerto 22 (SSH) - Para administración"
echo -e "      • Puerto 80 (HTTP) - Para redirect a HTTPS"
echo -e "      • Puerto 443 (HTTPS) - Para tráfico SSL"
echo -e "   💡 Ejecutar: ./scripts/aws-security-group-https.sh"

# 5. Verificar AWS CLI
echo ""
echo -e "${BLUE}5. ⚙️  Verificando AWS CLI...${NC}"
if command -v aws > /dev/null 2>&1; then
    if aws sts get-caller-identity > /dev/null 2>&1; then
        echo -e "   ✅ AWS CLI configurado correctamente"
        AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
        echo -e "   📋 Cuenta AWS: ${AWS_ACCOUNT}"
    else
        echo -e "   ⚠️  AWS CLI instalado pero no configurado"
        echo -e "   💡 Ejecutar: aws configure"
    fi
else
    echo -e "   ❌ AWS CLI no instalado"
    echo -e "   💡 Para Security Groups automáticos, instalar AWS CLI"
fi

# 6. Verificar scripts disponibles
echo ""
echo -e "${BLUE}6. 📜 Verificando scripts HTTPS...${NC}"

scripts=("setup-https-aws.sh" "aws-security-group-https.sh" "setup-alb-https.sh")
for script in "${scripts[@]}"; do
    if [[ -f "scripts/$script" ]]; then
        if [[ -x "scripts/$script" ]]; then
            echo -e "   ✅ scripts/${script} - Listo para ejecutar"
        else
            echo -e "   ⚠️  scripts/${script} - Necesita permisos: chmod +x scripts/${script}"
        fi
    else
        echo -e "   ❌ scripts/${script} - No encontrado"
    fi
done

# 7. Verificar espacio en disco (estimación)
echo ""
echo -e "${BLUE}7. 💾 Verificando recursos del sistema...${NC}"
echo -e "   📋 Requisitos estimados para HTTPS:"
echo -e "      • Nginx: ~2MB"
echo -e "      • Certbot: ~10MB"
echo -e "      • Certificados: ~10KB"
echo -e "   💡 Total: ~15MB adicionales"

# 8. Backup checklist
echo ""
echo -e "${BLUE}8. 💾 Checklist de Backup...${NC}"
echo -e "   📋 Antes de configurar HTTPS:"
echo -e "      • [ ] Backup de docker-compose.aws.yml"
echo -e "      • [ ] Backup de configuración de red actual"
echo -e "      • [ ] Documentar URLs HTTP actuales"
echo -e "      • [ ] Verificar que la app funciona en HTTP"

# 9. Resumen de próximos pasos
echo ""
echo -e "${GREEN}🎯 PRÓXIMOS PASOS PARA IMPLEMENTAR HTTPS:${NC}"
echo ""

if [[ -n "$DOMAIN" ]]; then
    echo -e "${YELLOW}OPCIÓN AUTOMÁTICA (Recomendada):${NC}"
    echo -e "   1. Configurar Security Groups:"
    echo -e "      ${GREEN}./scripts/aws-security-group-https.sh${NC}"
    echo -e "   2. Ejecutar configuración completa:"
    echo -e "      ${GREEN}ssh -i tu-key.pem ubuntu@3.254.74.19${NC}"
    echo -e "      ${GREEN}cd projects/scraper-proxies${NC}"
    echo -e "      ${GREEN}./scripts/setup-https-aws.sh ${DOMAIN}${NC}"
else
    echo -e "${YELLOW}PARA CONTINUAR NECESITAS:${NC}"
    echo -e "   1. Conseguir un dominio"
    echo -e "   2. Configurar DNS: dominio → 3.254.74.19"
    echo -e "   3. Ejecutar: ${GREEN}./scripts/pre-https-checklist.sh tu-dominio.com${NC}"
fi

echo ""
echo -e "${YELLOW}OPCIÓN MANUAL:${NC}"
echo -e "   • Ver documentación: ${GREEN}docs/CONFIGURACION-HTTPS-AWS.md${NC}"
echo -e "   • Task tracker: ${GREEN}docs/tasks/P3-F6_CONFIGURACION-HTTPS-LETSENCRYPT.md${NC}"

echo ""
echo -e "${BLUE}⏱️  Tiempo estimado total: 30-45 minutos${NC}"
echo -e "${BLUE}🔧 Downtime estimado: < 5 minutos${NC}" 