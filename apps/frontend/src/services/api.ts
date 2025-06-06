import type { ProxyResponse, HealthResponse, TestResponse } from '../types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check del backend
  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Test de conectividad
  async testConnection(): Promise<TestResponse> {
    return this.request<TestResponse>('/test');
  }

  // Scraping de proxies - simulado por ahora
  async scrapeProxies(sources?: string[]): Promise<ProxyResponse> {
    return this.request<ProxyResponse>('/scrape/test', {
      method: 'POST',
      body: JSON.stringify({ sources: sources || ['proxy-list-download'] }),
    });
  }

  // Validar proxies - endpoint que implementaremos
  async validateProxies(proxies: Array<{ ip: string; port: number; type: string }>) {
    return this.request('/validate/proxies', {
      method: 'POST',
      body: JSON.stringify({ proxies }),
    });
  }

  // Obtener estadísticas del servidor
  async getStats() {
    return this.request('/stats');
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
} = apiService; 