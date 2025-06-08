/**
 * Configuración para entorno de PRODUCCIÓN DOCKER - Backend
 * Puerto: 3081 (Container)
 * CORS: HTTP SIMPLE - Sin HTTPS
 */

export const productionConfig = {
  environment: 'production' as const,
  
  // Server Configuration
  server: {
    port: 3001, // Puerto interno del container (mapeado a 3081 externamente)
    host: '0.0.0.0',
  },
  
  // CORS Configuration - SOLO HTTP SIMPLE
  cors: {
    origin: [
      // HTTP - Configuración simple sin HTTPS
      'http://localhost:3080', // Frontend en Docker local
      'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080', // Frontend en AWS HTTP
      'http://3.254.74.19:3080', // IP directa
      
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