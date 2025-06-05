export interface ProxyData {
  ip: string;
  port: number;
  country: string;
  anonymity: string;
  speed: number;
  uptime: string;
  lastCheck: string;
  protocol: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5';
}

export interface ScrapingResult {
  success: boolean;
  proxies: ProxyData[];
  totalFound: number;
  source: string;
  timestamp: Date;
  error?: string;
}

export interface ValidationResult {
  proxy: ProxyData;
  isWorking: boolean;
  responseTime?: number;
  testedSite: string;
  error?: string;
  timestamp: Date;
}

export interface TestSite {
  name: string;
  url: string;
  expectedContent?: string;
  timeout?: number;
}

export interface ValidationSummary {
  totalTested: number;
  working: ValidationResult[];
  notWorking: ValidationResult[];
  successRate: number;
  averageResponseTime?: number;
} 