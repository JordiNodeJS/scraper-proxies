/**
 * Configuración unificada de la aplicación
 * Selecciona automáticamente la configuración según el entorno
 */

import { developmentConfig, type DevelopmentConfig } from './environments/development.config';
import { productionConfig, type ProductionConfig } from './environments/production.config';

// Tipo unión de todas las configuraciones
export type AppConfig = DevelopmentConfig | ProductionConfig;

// Mapa de configuraciones disponibles
const configurations = {
  development: developmentConfig,
  production: productionConfig,
} as const;

/**
 * Detecta el entorno actual basado en variables de Vite
 */
function detectEnvironment(): keyof typeof configurations {
  // En desarrollo (Vite dev server)
  if (import.meta.env.DEV) {
    return 'development';
  }
  
  // En producción (build)
  if (import.meta.env.PROD) {
    return 'production';
  }
  
  // Fallback por defecto
  return 'development';
}

/**
 * Configuración actual seleccionada automáticamente
 */
export const APP_CONFIG: AppConfig = configurations[detectEnvironment()];

/**
 * Función para obtener URLs dinámicas de la API
 */
export function getApiUrls() {
  const baseUrl = APP_CONFIG.api.baseUrl;
  
  // Si baseUrl está vacío (desarrollo), usar rutas relativas
  if (!baseUrl) {
    return {
      base: '',
      health: '/health',
      api: '/api',
      events: '/api/events',
      eventsStream: '/api/events/stream',
      logs: '/api/logs',
      scrape: '/api/scrape',
      scrapeReal: '/api/scrape/real',
      scrapeDirect: '/api/scrape/direct',
      test: '/api/test',
      stats: '/api/stats',
    };
  }
  
  // URLs completas para producción
  return {
    base: baseUrl,
    health: `${baseUrl}/health`,
    api: `${baseUrl}/api`,
    events: `${baseUrl}/api/events`,
    eventsStream: `${baseUrl}/api/events/stream`,
    logs: `${baseUrl}/api/logs`,
    scrape: `${baseUrl}/api/scrape`,
    scrapeReal: `${baseUrl}/api/scrape/real`,
    scrapeDirect: `${baseUrl}/api/scrape/direct`,
    test: `${baseUrl}/api/test`,
    stats: `${baseUrl}/api/stats`,
  };
}

/**
 * Función para obtener configuración de SSE
 */
export function getSSEConfig() {
  const urls = getApiUrls();
  
  return {
    url: urls.eventsStream,
    autoConnect: APP_CONFIG.sse.autoConnect,
    retryDelay: APP_CONFIG.sse.retryDelay,
    maxRetries: APP_CONFIG.sse.maxRetries,
    heartbeatTimeout: APP_CONFIG.sse.heartbeatTimeout,
  };
}

/**
 * Función para obtener configuración de UI
 */
export function getUIConfig() {
  return {
    enableDevtools: APP_CONFIG.ui.enableDevtools,
    defaultPageSize: APP_CONFIG.ui.defaultPageSize,
    autoScrollLogs: APP_CONFIG.ui.autoScrollLogs,
  };
}

/**
 * Imprime la configuración actual (solo en desarrollo)
 */
export function printAppConfig(): void {
  if (!APP_CONFIG.development.showConfigLogs) return;
  
  console.log('🎨 Configuración de la Aplicación:');
  console.log(`   Entorno: ${APP_CONFIG.environment}`);
  console.log(`   API Base URL: ${APP_CONFIG.api.baseUrl || 'Proxy de Vite'}`);
  console.log(`   Frontend: ${APP_CONFIG.urls.frontend}`);
  console.log(`   Backend: ${APP_CONFIG.urls.backend}`);
  console.log(`   DevTools: ${APP_CONFIG.ui.enableDevtools ? 'habilitado' : 'deshabilitado'}`);
  console.log(`   SSE Auto-connect: ${APP_CONFIG.sse.autoConnect ? 'sí' : 'no'}`);
  console.log(`   Page Size: ${APP_CONFIG.ui.defaultPageSize}`);
  
  const urls = getApiUrls();
  console.log('🌐 URLs de API:');
  console.log(`   Health: ${urls.health}`);
  console.log(`   SSE Stream: ${urls.eventsStream}`);
  console.log(`   Scraping: ${urls.scrapeDirect}`);
} 