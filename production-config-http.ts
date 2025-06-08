/**
 * Configuración para entorno de PRODUCCIÓN HTTP
 * Frontend: puerto 3080 (nginx proxy reverso)
 * Backend: puerto 3081 (Bun en container) vía proxy HTTP
 */

export const productionConfig = {
  environment: 'production' as const,

  // API Configuration - USANDO HTTP vía nginx proxy
  api: {
    baseUrl: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com', // HTTP sin puerto (80 por defecto)
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

  // URLs dinámicas (calculadas automáticamente) - TODAS HTTP
  urls: {
    frontend: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com',
    backend: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com',
    api: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com/api', // API vía nginx proxy
  },
} as const; 