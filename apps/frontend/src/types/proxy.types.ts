/**
 * Tipos TypeScript para el Frontend - Proxy Scraper
 * Importados desde packages/shared
 */

export interface ProxyData {
  ip: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  country?: string;
  countryCode?: string;
  city?: string;
  anonymity?: 'transparent' | 'anonymous' | 'elite';
  speed?: number; // ms
  uptime?: number; // percentage
  lastChecked?: Date;
  source: string; // URL de donde se extrajo
  isWorking?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ScrapingResult {
  success: boolean;
  proxies: ProxyData[];
  totalFound: number;
  errors: string[];
  timestamp: Date;
  executionTime: number; // ms
  source: {
    name: string;
    url: string;
    scrapedAt: Date;
  };
}

export interface ProxyTestResult {
  proxy: ProxyData;
  isWorking: boolean;
  responseTime: number;
  anonymityLevel: 'transparent' | 'anonymous' | 'elite' | 'unknown';
  testResults: Record<string, any>;
  errors: string[];
  testedAt: Date;
  testDuration: number;
}

export interface ScrapingSession {
  id: string;
  status: 'idle' | 'scraping' | 'validating' | 'completed' | 'error';
  progress: number; // 0-100
  currentPhase: string;
  proxiesFound: number;
  startTime: Date;
  endTime?: Date;
  errors: string[];
}

export interface ProgressUpdate {
  sessionId: string;
  progress: number;
  phase: string;
  message: string;
  proxiesFound: number;
  timestamp: Date;
} 