/**
 * Configuración para entorno de PRODUCCIÓN HTTP
 * Frontend: puerto 3080 via proxy nginx
 * Backend: puerto 3081 via proxy nginx  
 */

export const productionConfig = {
  environment: 'production' as const,

  // API Configuration
  api: {
    baseUrl: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com',
    timeout: 30000,
  },

  // Ports Configuration
  ports: {
    frontend: 3080,
    backend: 3081,
  },

  // Server-Sent Events
  sse: {
    autoConnect: true,
    retryDelay: 5000,
    maxRetries: 5,
    heartbeatTimeout: 90000,
  },

  // UI Configuration
  ui: {
    enableDevtools: false,
    defaultPageSize: 20,
    autoScrollLogs: false,
  },

  // Production Features
  development: {
    enableLogging: false,
    enableHotReload: false,
    showConfigLogs: false,
  },

  // URLs dinámicas (calculadas automáticamente)
  urls: {
    frontend: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com',
    backend: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com',
    api: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com/api',
  },
} as const;

export type ProductionConfig = typeof productionConfig; 