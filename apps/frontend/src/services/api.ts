import type { ProxyResponse, HealthResponse, TestResponse } from '../types/api.types';

// Configuración base del API
// En desarrollo usa el proxy de Vite, en producción usa la URL completa
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? '' : 'http://localhost:3001');

// Tipo para los logs del backend
export interface BackendLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'error' | 'warning' | 'success';
  message: string;
  source: 'backend';
}

export interface LogsResponse {
  success: boolean;
  data: {
    logs: BackendLogEntry[];
    total: number;
    limit: number;
  };
  timestamp: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log(`🌐 API Request: ${options?.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check del backend
  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Test de conectividad
  async testConnection(): Promise<TestResponse> {
    return this.request<TestResponse>('/api/test');
  }

  // Scraping de proxies - simulado por ahora
  async scrapeProxies(sources?: string[]): Promise<ProxyResponse> {
    return this.request<ProxyResponse>('/api/scrape/test', {
      method: 'POST',
      body: JSON.stringify({ sources: sources || ['proxy-list-download'] }),
    });
  }

  // Scraping REAL de proxies usando Playwright
  async scrapeRealProxies(): Promise<ProxyResponse> {
    console.log('🚀 Iniciando scraping real desde frontend...');
    return this.request<ProxyResponse>('/api/scrape/real', {
      method: 'POST',
    });
  }

  // Scraping DIRECTO de proxies reales (sin Playwright)
  async scrapeDirectProxies(): Promise<ProxyResponse> {
    console.log('🎯 Iniciando scraping directo de proxies REALES...');
    return this.request<ProxyResponse>('/api/scrape/direct', {
      method: 'POST',
    });
  }

  // Validar proxies - endpoint que implementaremos
  async validateProxies(proxies: Array<{ ip: string; port: number; type: string }>) {
    return this.request('/api/validate/proxies', {
      method: 'POST',
      body: JSON.stringify({ proxies }),
    });
  }

  // Obtener estadísticas del servidor
  async getStats() {
    return this.request('/api/stats');
  }

  // Obtener configuración del scraper
  async getConfig() {
    return this.request('/api/config');
  }

  // Obtener logs del backend
  async getLogs(limit: number = 50): Promise<LogsResponse> {
    return this.request<LogsResponse>(`/api/logs?limit=${limit}`);
  }
}

// Instancia singleton del servicio API
export const apiService = new ApiService();

// Export individual de métodos para facilitar el uso
export const {
  healthCheck,
  testConnection,
  scrapeProxies,
  validateProxies,
  getStats,
  getConfig,
  getLogs,
} = apiService;

// Export adicional de la función de scraping real
export const { scrapeRealProxies } = apiService; 