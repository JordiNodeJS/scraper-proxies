/**
 * Configuración unificada del backend
 * Selecciona automáticamente la configuración según el entorno
 */

import { developmentConfig, type DevelopmentBackendConfig } from './environments/development.config';
import { productionConfig, type ProductionBackendConfig } from './environments/production.config';

// Tipo unión de todas las configuraciones
export type BackendAppConfig = DevelopmentBackendConfig | ProductionBackendConfig;

// Mapa de configuraciones disponibles
const configurations = {
  development: developmentConfig,
  production: productionConfig,
} as const;

/**
 * Detecta el entorno actual basado en NODE_ENV
 */
function detectEnvironment(): keyof typeof configurations {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  
  // Producción explícita
  if (nodeEnv === 'production') {
    return 'production';
  }
  
  // Desarrollo por defecto
  return 'development';
}

/**
 * Configuración actual seleccionada automáticamente
 */
export const BACKEND_APP_CONFIG: BackendAppConfig = configurations[detectEnvironment()];

/**
 * Función para obtener configuración del servidor
 */
export function getServerConfig() {
  return {
    port: BACKEND_APP_CONFIG.server.port,
    host: BACKEND_APP_CONFIG.server.host,
  };
}

/**
 * Función para obtener configuración de CORS
 */
export function getCorsConfig() {
  return {
    origin: BACKEND_APP_CONFIG.cors.origin,
    credentials: BACKEND_APP_CONFIG.cors.credentials,
  };
}

/**
 * Función para obtener configuración de SSE
 */
export function getSSEConfig() {
  return {
    heartbeatInterval: BACKEND_APP_CONFIG.sse.heartbeatInterval,
    clientTimeout: BACKEND_APP_CONFIG.sse.clientTimeout,
  };
}

/**
 * Función para obtener configuración de scraping
 */
export function getScrapingConfig() {
  return {
    delay: BACKEND_APP_CONFIG.scraping.delay,
    maxConcurrentSources: BACKEND_APP_CONFIG.scraping.maxConcurrentSources,
    requestTimeout: BACKEND_APP_CONFIG.scraping.requestTimeout,
  };
}

/**
 * Función para obtener configuración de logging
 */
export function getLoggingConfig() {
  return {
    level: BACKEND_APP_CONFIG.logging.level,
    maxLogs: BACKEND_APP_CONFIG.logging.maxLogs,
    enableConsole: BACKEND_APP_CONFIG.logging.enableConsole,
    enableFile: BACKEND_APP_CONFIG.logging.enableFile,
  };
}

/**
 * Función para obtener URLs dinámicas
 */
export function getApiUrls() {
  const port = BACKEND_APP_CONFIG.server.port;
  const baseUrl = `http://localhost:${port}`;
  
  return {
    base: baseUrl,
    health: `${baseUrl}/health`,
    api: `${baseUrl}/api`,
    events: `${baseUrl}/api/events`,
    eventsStream: `${baseUrl}/api/events/stream`,
    logs: `${baseUrl}/api/logs`,
    scrape: `${baseUrl}/api/scrape`,
  };
}

/**
 * Imprime la configuración actual (solo si está habilitado)
 */
export function printBackendConfig(): void {
  if (!BACKEND_APP_CONFIG.development.showConfigLogs) return;
  
  console.log('🔧 Configuración del Backend:');
  console.log(`   Entorno: ${BACKEND_APP_CONFIG.environment}`);
  console.log(`   Puerto: ${BACKEND_APP_CONFIG.server.port}`);
  console.log(`   CORS Origins: ${BACKEND_APP_CONFIG.cors.origin.join(', ')}`);
  console.log(`   SSE Heartbeat: ${BACKEND_APP_CONFIG.sse.heartbeatInterval}ms`);
  console.log(`   Scraping Delay: ${BACKEND_APP_CONFIG.scraping.delay}ms`);
  console.log(`   Log Level: ${BACKEND_APP_CONFIG.logging.level}`);
  console.log(`   Max Logs: ${BACKEND_APP_CONFIG.logging.maxLogs}`);
  
  const urls = getApiUrls();
  console.log('🌐 URLs disponibles:');
  console.log(`   Health: ${urls.health}`);
  console.log(`   API: ${urls.api}`);
  console.log(`   SSE Stream: ${urls.eventsStream}`);
} 