/**
 * Configuración centralizada de variables de entorno - Frontend
 */

export interface FrontendEnvConfig {
  // API
  API_BASE_URL: string;
  API_TIMEOUT: number;
  
  // SSE
  SSE_AUTO_CONNECT: boolean;
  SSE_RETRY_DELAY: number;
  SSE_MAX_RETRIES: number;
  SSE_HEARTBEAT_TIMEOUT: number;
  
  // UI
  ENABLE_DEVTOOLS: boolean;
  DEFAULT_PAGE_SIZE: number;
  AUTO_SCROLL_LOGS: boolean;
  
  // Development
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
}

/**
 * Configuración por defecto
 */
const DEFAULT_CONFIG: FrontendEnvConfig = {
  // API - En desarrollo usa proxy de Vite, en producción usa variable de entorno
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  API_TIMEOUT: 30000, // 30 segundos
  
  // SSE
  SSE_AUTO_CONNECT: true,
  SSE_RETRY_DELAY: 3000,    // 3 segundos
  SSE_MAX_RETRIES: 10,
  SSE_HEARTBEAT_TIMEOUT: 60000, // 60 segundos
  
  // UI
  ENABLE_DEVTOOLS: true,
  DEFAULT_PAGE_SIZE: 20,
  AUTO_SCROLL_LOGS: false,
  
  // Development
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
};

/**
 * Parsea una variable de entorno como número
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parsea una variable de entorno como boolean
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parsea una variable de entorno como string
 */
function parseString(value: string | undefined, defaultValue: string): string {
  return value || defaultValue;
}

/**
 * Carga y valida la configuración desde variables de entorno
 */
export function loadFrontendEnvConfig(): FrontendEnvConfig {
  return {
    // API
    API_BASE_URL: parseString(
      import.meta.env.VITE_API_URL, 
      DEFAULT_CONFIG.API_BASE_URL
    ),
    API_TIMEOUT: parseNumber(
      import.meta.env.VITE_API_TIMEOUT, 
      DEFAULT_CONFIG.API_TIMEOUT
    ),
    
    // SSE
    SSE_AUTO_CONNECT: parseBoolean(
      import.meta.env.VITE_SSE_AUTO_CONNECT, 
      DEFAULT_CONFIG.SSE_AUTO_CONNECT
    ),
    SSE_RETRY_DELAY: parseNumber(
      import.meta.env.VITE_SSE_RETRY_DELAY, 
      DEFAULT_CONFIG.SSE_RETRY_DELAY
    ),
    SSE_MAX_RETRIES: parseNumber(
      import.meta.env.VITE_SSE_MAX_RETRIES, 
      DEFAULT_CONFIG.SSE_MAX_RETRIES
    ),
    SSE_HEARTBEAT_TIMEOUT: parseNumber(
      import.meta.env.VITE_SSE_HEARTBEAT_TIMEOUT, 
      DEFAULT_CONFIG.SSE_HEARTBEAT_TIMEOUT
    ),
    
    // UI
    ENABLE_DEVTOOLS: parseBoolean(
      import.meta.env.VITE_ENABLE_DEVTOOLS, 
      DEFAULT_CONFIG.ENABLE_DEVTOOLS
    ),
    DEFAULT_PAGE_SIZE: parseNumber(
      import.meta.env.VITE_DEFAULT_PAGE_SIZE, 
      DEFAULT_CONFIG.DEFAULT_PAGE_SIZE
    ),
    AUTO_SCROLL_LOGS: parseBoolean(
      import.meta.env.VITE_AUTO_SCROLL_LOGS, 
      DEFAULT_CONFIG.AUTO_SCROLL_LOGS
    ),
    
    // Development
    IS_DEVELOPMENT: DEFAULT_CONFIG.IS_DEVELOPMENT,
    IS_PRODUCTION: DEFAULT_CONFIG.IS_PRODUCTION,
  };
}

/**
 * Configuración global cargada
 */
export const FRONTEND_ENV_CONFIG = loadFrontendEnvConfig();

/**
 * Función para obtener URLs dinámicas de la API
 */
export function getApiUrls() {
  const baseUrl = FRONTEND_ENV_CONFIG.API_BASE_URL;
  
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
  return {
    url: getApiUrls().eventsStream,
    autoConnect: FRONTEND_ENV_CONFIG.SSE_AUTO_CONNECT,
    retryDelay: FRONTEND_ENV_CONFIG.SSE_RETRY_DELAY,
    maxRetries: FRONTEND_ENV_CONFIG.SSE_MAX_RETRIES,
    heartbeatTimeout: FRONTEND_ENV_CONFIG.SSE_HEARTBEAT_TIMEOUT,
  };
}

/**
 * Imprime la configuración actual (para debugging)
 */
export function printFrontendConfig(): void {
  if (!FRONTEND_ENV_CONFIG.IS_DEVELOPMENT) return;
  
  console.log('🎨 Configuración del Frontend:');
  console.log(`   API Base URL: ${FRONTEND_ENV_CONFIG.API_BASE_URL}`);
  console.log(`   Entorno: ${FRONTEND_ENV_CONFIG.IS_DEVELOPMENT ? 'development' : 'production'}`);
  console.log(`   DevTools: ${FRONTEND_ENV_CONFIG.ENABLE_DEVTOOLS ? 'habilitado' : 'deshabilitado'}`);
  console.log(`   SSE Auto-connect: ${FRONTEND_ENV_CONFIG.SSE_AUTO_CONNECT ? 'sí' : 'no'}`);
  console.log(`   Page Size: ${FRONTEND_ENV_CONFIG.DEFAULT_PAGE_SIZE}`);
  
  const urls = getApiUrls();
  console.log('🌐 URLs de API:');
  console.log(`   Health: ${urls.health}`);
  console.log(`   SSE Stream: ${urls.eventsStream}`);
  console.log(`   Scraping: ${urls.scrapeDirect}`);
} 