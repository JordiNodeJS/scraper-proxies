#!/bin/bash
cd /home/ubuntu/projects/scraper-proxies

# Backup
cp apps/backend/src/config/environments/production.config.ts apps/backend/src/config/environments/production.config.ts.backup2

# Crear archivo correcto
cat > apps/backend/src/config/environments/production.config.ts << 'EOF'
/**
 * Configuración para entorno de PRODUCCIÓN DOCKER - Backend
 * Puerto: 3081 (Container)  
 * CORS: localhost:3080 (Frontend en Docker) + HTTPS AWS
 */

export const productionConfig = {
  environment: 'production' as const,
  
  // Server Configuration
  server: {
    port: 3001, // Puerto interno del container (mapeado a 3081 externamente)
    host: '0.0.0.0',
  },
  
  // CORS Configuration - INCLUYE HTTPS PARA NGINX SSL
  cors: {
    origin: [
      'http://localhost:3080', // Frontend en Docker local
      'http://localhost:3800', // Compatibilidad con configuración anterior
      'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080', // Frontend en AWS HTTP
      'https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com', // Frontend via nginx HTTPS
      process.env.CORS_ORIGIN, // Variable de entorno dinámica
    ].filter(Boolean), // Filtrar valores undefined/null
    credentials: true,
  },
  
  // Server-Sent Events
  sse: {
    heartbeatInterval: 45000, // 45 segundos (más conservador en producción)
    clientTimeout: 90000,     // 90 segundos
  },
  
  // Scraping Configuration
  scraping: {
    delay: 2000,              // 2 segundos entre requests (más conservador)
    maxConcurrentSources: 3,  // Menos concurrencia en producción
    requestTimeout: 15000,    // 15 segundos timeout (más tiempo)
  },
  
  // Logging Configuration
  logging: {
    level: 'warn' as const,   // Solo warnings y errores en producción
    maxLogs: 50,              // Menos logs en memoria
    enableConsole: true,
    enableFile: true,         // Habilitar logs a archivo en producción
  },
  
  // Production Features
  development: {
    enableHotReload: false,
    showConfigLogs: true,     // Habilitar logs temporalmente para debug
    enableDetailedErrors: false, // Errores simplificados en producción
  },
} as const;

export type ProductionBackendConfig = typeof productionConfig;
EOF

echo "Archivo actualizado correctamente"
echo "=== VERIFICANDO CORS ==="
grep -A10 "cors:" apps/backend/src/config/environments/production.config.ts 