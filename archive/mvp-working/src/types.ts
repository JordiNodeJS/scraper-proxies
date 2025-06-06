export interface ProxyData {
  ip: string;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5';
  anonymity: 'Elite' | 'Anonymous' | 'Transparent';
  country: string;
  countryCode: string;
  speed: number; // en ms
  uptime?: number; // porcentaje
  lastChecked: Date;
  source: string;
  isWorking?: boolean;
}

export interface ProxySource {
  name: string;
  url: string;
  protocol: ProxyData['protocol'];
  parser: string; // nombre del parser a usar
  rateLimit: number; // ms entre requests
  headers?: Record<string, string>;
}

export interface ScrapingResult {
  source: string;
  success: boolean;
  proxies: ProxyData[];
  error?: string;
  responseTime: number;
  totalFound: number;
}

export interface ValidationResult {
  proxy: ProxyData;
  isWorking: boolean;
  responseTime?: number;
  error?: string;
  testedAt: Date;
}

export interface ScrapingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  sources: ScrapingResult[];
  totalProxies: number;
  workingProxies: number;
  status: 'running' | 'completed' | 'error';
} 