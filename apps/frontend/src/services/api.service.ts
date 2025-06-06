/**
 * Servicio principal para comunicación con API backend
 */

import type { 
  ApiResponse, 
  ScrapingRequest, 
  ValidationRequest, 
  ScrapingAPI 
} from '../types/api.types';
import type { ProxyData, ScrapingSession, ProgressUpdate, ProxyTestResult } from '../types/proxy.types';

class ApiService implements ScrapingAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Scraping endpoints
  async startScraping(request: ScrapingRequest): Promise<ApiResponse<ScrapingSession>> {
    return this.request<ScrapingSession>('/api/scrape/start', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getProgress(sessionId: string): Promise<ApiResponse<ProgressUpdate>> {
    return this.request<ProgressUpdate>(`/api/scrape/progress/${sessionId}`);
  }

  async getResults(sessionId: string): Promise<ApiResponse<ProxyData[]>> {
    return this.request<ProxyData[]>(`/api/scrape/results/${sessionId}`);
  }

  // Validation endpoints
  async validateProxies(request: ValidationRequest): Promise<ApiResponse<ProxyTestResult[]>> {
    return this.request<ProxyTestResult[]>('/api/validate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async testProxy(proxy: ProxyData, url: string): Promise<ApiResponse<ProxyTestResult>> {
    return this.request<ProxyTestResult>('/api/validate/single', {
      method: 'POST',
      body: JSON.stringify({ proxy, url }),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; uptime: number }>> {
    return this.request<{ status: string; uptime: number }>('/health');
  }

  // Utility methods
  async getAllProxies(): Promise<ApiResponse<ProxyData[]>> {
    return this.request<ProxyData[]>('/api/scrape/all', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getHttpsProxies(): Promise<ApiResponse<ProxyData[]>> {
    return this.request<ProxyData[]>('/api/scrape/https', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getHttpProxies(): Promise<ApiResponse<ProxyData[]>> {
    return this.request<ProxyData[]>('/api/scrape/http', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }
}

// Singleton instance
export const apiService = new ApiService();
export default apiService; 