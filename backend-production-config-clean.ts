/**
 * Configuración para entorno de PRODUCCIÓN
 * Backend con configuración CORS para HTTP proxy reverso
 */

export const productionConfig = {
  environment: 'production' as const,

  // Server Configuration
  server: {
    port: 3001, // Puerto interno del container (mapeado a 3081 externamente)
    host: '0.0.0.0',
  },

  // CORS Configuration - HTTP URLs para proxy reverso
  cors: {
    origin: [
      'http://localhost:3080', // Frontend en Docker local
      'http://localhost:3800', // Compatibilidad con configuración anterior
      'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080', // Frontend directo con puerto
      'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com', // Frontend via nginx proxy HTTP
      'https://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com', // Frontend via nginx HTTPS (si se configura)
      process.env.CORS_ORIGIN, // Variable de entorno dinámica
    ].filter(Boolean), // Filtrar valores undefined/null
    credentials: true,
  },

  // Server-Sent Events
  sse: {
    heartbeatInterval: 45000, // 45 segundos (más conservador en producción)
    clientTimeout: 90000,     // 90 segundos
    autoCleanup: true,
    maxConnections: 100,      // Límite de conexiones concurrentes
  },

  // API Configuration
  api: {
    timeout: 30000,  // 30 segundos para requests externos
    retries: 3,      // Máximo 3 reintentos
    rateLimit: {
      windowMs: 60000,  // 1 minuto
      max: 100,         // 100 requests por minuto por IP
    },
  },

  // Logging
  logging: {
    level: 'warn' as const,   // Solo warnings y errores en producción
    enableRequestLogs: true,
    enableErrorLogs: true,
    enablePerformanceLogs: false,
  },

  // Performance
  performance: {
    enableCaching: true,
    cacheTimeout: 300000,    // 5 minutos
    enableCompression: true,
  },

  // Security
  security: {
    enableHelmet: true,
    enableCsrf: false,        // Deshabilitado para API
    rateLimitEnabled: true,
  },

  // Features habilitadas en producción
  features: {
    enableScraping: true,
    enableValidation: true,
    enableExport: true,
    enableMetrics: true,
    enableHealthChecks: true,
  },

  // URLs dinámicas (calculadas automáticamente)
  urls: {
    frontend: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com',
    public: 'http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com',
  },
} as const;

export type ProductionConfig = typeof productionConfig; 