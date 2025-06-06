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