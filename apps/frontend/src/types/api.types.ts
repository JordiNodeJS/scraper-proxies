/**
 * Tipos para la comunicación con la API backend
 */

import type { ProxyData, ScrapingSession, ProgressUpdate, ProxyTestResult } from './proxy.types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ScrapingRequest {
  sources?: string[];
  protocols?: ('http' | 'https' | 'socks4' | 'socks5')[];
  countries?: string[];
  validateProxies?: boolean;
}

export interface ValidationRequest {
  proxies: ProxyData[];
  testUrl?: string;
  timeout?: number;
}

// API Endpoints interfaces
export interface ScrapingAPI {
  // Scraping endpoints
  startScraping(request: ScrapingRequest): Promise<ApiResponse<ScrapingSession>>;
  getProgress(sessionId: string): Promise<ApiResponse<ProgressUpdate>>;
  getResults(sessionId: string): Promise<ApiResponse<ProxyData[]>>;
  
  // Validation endpoints
  validateProxies(request: ValidationRequest): Promise<ApiResponse<ProxyTestResult[]>>;
  testProxy(proxy: ProxyData, url: string): Promise<ApiResponse<ProxyTestResult>>;
  
  // Health check
  healthCheck(): Promise<ApiResponse<{ status: string; uptime: number }>>;
}

export interface WebSocketMessage {
  type: 'progress' | 'complete' | 'error' | 'proxy_found';
  sessionId: string;
  data: any;
  timestamp: Date;
}

// Tipos para las respuestas de la API

export interface Proxy {
  ip: string;
  port: number;
  type: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5';
  country?: string;
  anonymity?: 'transparent' | 'anonymous' | 'elite';
  speed?: number; // ms de respuesta
  uptime?: number; // porcentaje de tiempo activo
  lastChecked?: string; // ISO timestamp
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  runtime: string;
  version: string;
}

export interface TestResponse {
  message: string;
  timestamp: string;
  server: string;
  status: 'functional' | 'error';
}

export interface ProxyResponse {
  success: boolean;
  data: {
    total: number;
    proxies: Proxy[];
    note?: string;
    source?: string;
    scrapingTime?: number; // tiempo en ms
  };
  timestamp: string;
  error?: string;
}

export interface ValidationResult {
  proxy: Proxy;
  isWorking: boolean;
  responseTime?: number;
  error?: string;
  checkedAt: string;
}

export interface ValidationResponse {
  success: boolean;
  data: {
    total: number;
    working: number;
    failed: number;
    results: ValidationResult[];
  };
  timestamp: string;
  error?: string;
}

export interface StatsResponse {
  totalProxiesScraped: number;
  totalProxiesValidated: number;
  workingProxies: number;
  averageResponseTime: number;
  uptime: string;
  lastScrape?: string;
  sources: Array<{
    name: string;
    proxiesFound: number;
    lastUpdate: string;
    status: 'active' | 'inactive' | 'error';
  }>;
}

// Tipos para filtros y configuración
export interface ScrapeConfig {
  sources?: string[];
  maxProxies?: number;
  timeout?: number;
  validateOnScrape?: boolean;
}

export interface ValidationConfig {
  timeout: number;
  targetUrl: string;
  maxConcurrent: number;
} 