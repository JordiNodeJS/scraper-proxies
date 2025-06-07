/**
 * Configuración centralizada de variables de entorno - Backend
 */

export interface EnvConfig {
  // Server
  PORT: number;
  NODE_ENV: string;
  
  // CORS
  CORS_ORIGIN: string;
  
  // SSE
  SSE_HEARTBEAT_INTERVAL: number;
  SSE_CLIENT_TIMEOUT: number;
  
  // Scraping
  SCRAPING_DELAY: number;
  MAX_CONCURRENT_SOURCES: number;
  REQUEST_TIMEOUT: number;
  
  // Logging
  LOG_LEVEL: string;
  MAX_LOGS: number;
}

/**
 * Configuración por defecto
 */
const DEFAULT_CONFIG: EnvConfig = {
  // Server
  PORT: 3001,
  NODE_ENV: 'development',
  
  // CORS - Soporta múltiples orígenes separados por coma
  CORS_ORIGIN: 'http://localhost:5173,http://localhost:4173',
  
  // SSE
  SSE_HEARTBEAT_INTERVAL: 30000, // 30 segundos
  SSE_CLIENT_TIMEOUT: 60000,     // 60 segundos
  
  // Scraping
  SCRAPING_DELAY: 1000,          // 1 segundo entre requests
  MAX_CONCURRENT_SOURCES: 4,     // Máximo 4 fuentes simultáneas
  REQUEST_TIMEOUT: 10000,        // 10 segundos timeout
  
  // Logging
  LOG_LEVEL: 'info',
  MAX_LOGS: 100,
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
 * Parsea una variable de entorno como string
 */
function parseString(value: string | undefined, defaultValue: string): string {
  return value || defaultValue;
}

/**
 * Carga y valida la configuración desde variables de entorno
 */
export function loadEnvConfig(): EnvConfig {
  return {
    // Server
    PORT: parseNumber(process.env.PORT, DEFAULT_CONFIG.PORT),
    NODE_ENV: parseString(process.env.NODE_ENV, DEFAULT_CONFIG.NODE_ENV),
    
    // CORS
    CORS_ORIGIN: parseString(process.env.CORS_ORIGIN, DEFAULT_CONFIG.CORS_ORIGIN),
    
    // SSE
    SSE_HEARTBEAT_INTERVAL: parseNumber(
      process.env.SSE_HEARTBEAT_INTERVAL, 
      DEFAULT_CONFIG.SSE_HEARTBEAT_INTERVAL
    ),
    SSE_CLIENT_TIMEOUT: parseNumber(
      process.env.SSE_CLIENT_TIMEOUT, 
      DEFAULT_CONFIG.SSE_CLIENT_TIMEOUT
    ),
    
    // Scraping
    SCRAPING_DELAY: parseNumber(
      process.env.SCRAPING_DELAY, 
      DEFAULT_CONFIG.SCRAPING_DELAY
    ),
    MAX_CONCURRENT_SOURCES: parseNumber(
      process.env.MAX_CONCURRENT_SOURCES, 
      DEFAULT_CONFIG.MAX_CONCURRENT_SOURCES
    ),
    REQUEST_TIMEOUT: parseNumber(
      process.env.REQUEST_TIMEOUT, 
      DEFAULT_CONFIG.REQUEST_TIMEOUT
    ),
    
    // Logging
    LOG_LEVEL: parseString(process.env.LOG_LEVEL, DEFAULT_CONFIG.LOG_LEVEL),
    MAX_LOGS: parseNumber(process.env.MAX_LOGS, DEFAULT_CONFIG.MAX_LOGS),
  };
}

/**
 * Configuración global cargada
 */
export const ENV_CONFIG = loadEnvConfig();

/**
 * Función para obtener URLs dinámicas
 */
export function getApiUrls() {
  const baseUrl = `http://localhost:${ENV_CONFIG.PORT}`;
  
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
 * Imprime la configuración actual (para debugging)
 */
export function printConfig(): void {
  console.log('🔧 Configuración del Backend:');
  console.log(`   Puerto: ${ENV_CONFIG.PORT}`);
  console.log(`   Entorno: ${ENV_CONFIG.NODE_ENV}`);
  console.log(`   CORS Origin: ${ENV_CONFIG.CORS_ORIGIN}`);
  console.log(`   SSE Heartbeat: ${ENV_CONFIG.SSE_HEARTBEAT_INTERVAL}ms`);
  console.log(`   Scraping Delay: ${ENV_CONFIG.SCRAPING_DELAY}ms`);
  console.log(`   Max Logs: ${ENV_CONFIG.MAX_LOGS}`);
  
  const urls = getApiUrls();
  console.log('🌐 URLs disponibles:');
  console.log(`   Health: ${urls.health}`);
  console.log(`   API: ${urls.api}`);
  console.log(`   SSE Stream: ${urls.eventsStream}`);
} 