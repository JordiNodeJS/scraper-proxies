/**
 * Configuración para entorno de DESARROLLO LOCAL
 * Frontend: puerto 5173 (Vite dev server)
 * Backend: puerto 3001 (Bun nativo)
 */

export const developmentConfig = {
  environment: 'development' as const,
  
  // API Configuration
  api: {
    baseUrl: '', // Proxy de Vite - cadena vacía para usar proxy automático
    timeout: 30000, // 30 segundos
  },
  
  // Ports Configuration
  ports: {
    frontend: 5173,
    backend: 3001,
  },
  
  // Server-Sent Events
  sse: {
    autoConnect: true,
    retryDelay: 3000,    // 3 segundos
    maxRetries: 10,
    heartbeatTimeout: 60000, // 60 segundos
  },
  
  // UI Configuration
  ui: {
    enableDevtools: true,
    defaultPageSize: 20,
    autoScrollLogs: false,
  },
  
  // Development Features
  development: {
    enableLogging: true,
    enableHotReload: true,
    showConfigLogs: true,
  },
  
  // URLs dinámicas (calculadas automáticamente)
  urls: {
    frontend: 'http://localhost:5173',
    backend: 'http://localhost:3001',
    api: '/api', // Relativo para proxy de Vite
  },
} as const;

export type DevelopmentConfig = typeof developmentConfig; 