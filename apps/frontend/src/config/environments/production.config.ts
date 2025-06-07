/**
 * Configuración para entorno de PRODUCCIÓN DOCKER
 * Frontend: puerto 3080 (nginx)
 * Backend: puerto 3081 (Bun en container)
 */

export const productionConfig = {
  environment: 'production' as const,
  
  // API Configuration
  api: {
    baseUrl: 'http://localhost:3081', // URL completa para producción
    timeout: 30000, // 30 segundos
  },
  
  // Ports Configuration
  ports: {
    frontend: 3080,
    backend: 3081,
  },
  
  // Server-Sent Events
  sse: {
    autoConnect: true,
    retryDelay: 5000,    // 5 segundos (más conservador en producción)
    maxRetries: 5,       // Menos reintentos en producción
    heartbeatTimeout: 90000, // 90 segundos (más tiempo en producción)
  },
  
  // UI Configuration
  ui: {
    enableDevtools: false, // Deshabilitado en producción
    defaultPageSize: 20,
    autoScrollLogs: false,
  },
  
  // Production Features
  development: {
    enableLogging: false,  // Logs mínimos en producción
    enableHotReload: false,
    showConfigLogs: false,
  },
  
  // URLs dinámicas (calculadas automáticamente)
  urls: {
    frontend: 'http://localhost:3080',
    backend: 'http://localhost:3081',
    api: 'http://localhost:3081/api', // URL completa para producción
  },
} as const;

export type ProductionConfig = typeof productionConfig; 