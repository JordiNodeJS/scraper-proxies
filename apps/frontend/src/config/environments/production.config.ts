/**
 * Configuración para entorno de PRODUCCIÓN DOCKER
 * Frontend: puerto 3080 (nginx)
 * Backend: puerto 3081 (Bun en container) vía proxy HTTPS
 */

export const productionConfig = {
  environment: 'production' as const,
  
  // API Configuration - USANDO HTTPS vía nginx proxy
  api: {
    baseUrl: 'https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com', // HTTPS sin puerto (443 por defecto)
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
  
  // URLs dinámicas (calculadas automáticamente) - TODAS HTTPS
  urls: {
    frontend: 'https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com',
    backend: 'https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com',
    api: 'https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com/api', // API vía nginx proxy
  },
} as const;

export type ProductionConfig = typeof productionConfig; 