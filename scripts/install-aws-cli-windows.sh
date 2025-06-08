#!/bin/bash

# Script para instalar AWS CLI en Windows (Git Bash)
# Uso: ./scripts/install-aws-cli-windows.sh

echo "🔧 Instalando AWS CLI en Windows..."
echo "════════════════════════════════════"

echo ""
echo "📋 OPCIÓN 1: Installer MSI (Recomendado)"
echo "1. Descargar: https://awscli.amazonaws.com/AWSCLIV2.msi"
echo "2. Ejecutar installer como administrador"
echo "3. Reiniciar Git Bash"
echo "4. Verificar: aws --version"

echo ""
echo "📋 OPCIÓN 2: PowerShell (Automático)"
echo "Ejecutar en PowerShell como administrador:"
echo ""
echo "# Descargar AWS CLI"
echo 'Invoke-WebRequest -Uri "https://awscli.amazonaws.com/AWSCLIV2.msi" -OutFile "AWSCLIV2.msi"'
echo ""
echo "# Instalar silenciosamente"
echo 'Start-Process msiexec.exe -Wait -ArgumentList "/I AWSCLIV2.msi /quiet"'
echo ""
echo "# Limpiar"
echo 'Remove-Item "AWSCLIV2.msi"'

echo ""
echo "📋 OPCIÓN 3: Manual con curl"
if command -v curl > /dev/null; then
    echo "Descargando AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-windows-x86_64.zip" -o "awscliv2.zip"
    echo "✅ Descargado awscliv2.zip"
    echo "💡 Extraer y ejecutar install.bat"
else
    echo "❌ curl no disponible"
fi

echo ""
echo "🔧 DESPUÉS DE INSTALAR:"
echo "1. Reiniciar Git Bash"
echo "2. Configurar: aws configure"
echo "3. Ingresar Access Key ID y Secret"
echo "4. Región: eu-west-1"
echo "5. Output format: json"

echo ""
echo "✅ Una vez configurado, podrás usar:"
echo "   ./scripts/aws-security-group-https.sh" 