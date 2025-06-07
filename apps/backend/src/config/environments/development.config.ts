/**
 * Configuración para entorno de DESARROLLO LOCAL - Backend
 * Puerto: 3001 (Bun nativo)
 * CORS: localhost:5173 (Vite dev server)
 */

export const developmentConfig = {
  environment: 'development' as const,
  
  // Server Configuration
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
  
  // CORS Configuration
  cors: {
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:4173', // Vite preview
    ],
    credentials: true,
  },
  
  // Server-Sent Events
  sse: {
    heartbeatInterval: 30000, // 30 segundos
    clientTimeout: 60000,     // 60 segundos
  },
  
  // Scraping Configuration
  scraping: {
    delay: 1000,              // 1 segundo entre requests
    maxConcurrentSources: 4,  // Máximo 4 fuentes simultáneas
    requestTimeout: 10000,    // 10 segundos timeout
  },
  
  // Logging Configuration
  logging: {
    level: 'info' as const,
    maxLogs: 100,
    enableConsole: true,
    enableFile: false,
  },
  
  // Development Features
  development: {
    enableHotReload: true,
    showConfigLogs: true,
    enableDetailedErrors: true,
  },
} as const;

export type DevelopmentBackendConfig = typeof developmentConfig; 