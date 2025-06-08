/**
 * Configuración para entorno de PRODUCCIÓN HTTP SIMPLE
 * Frontend: puerto 3080 (acceso directo)
 * Backend: puerto 3081 (acceso directo)
 */

export const productionConfig = {
  environment: 'production' as const,
  
  // API Configuration - HTTP SIMPLE sin nginx proxy
  api: {
    baseUrl: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081', // HTTP directo al backend
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
  
  // URLs dinámicas (calculadas automáticamente) - HTTP SIMPLE
  urls: {
    frontend: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080',
    backend: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081',
    api: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081/api', // API directa al backend
  },
} as const;

export type ProductionConfig = typeof productionConfig; 