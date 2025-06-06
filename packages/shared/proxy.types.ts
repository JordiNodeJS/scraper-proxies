/**
 * Tipos TypeScript para el MVP Proxy Scraper
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

export interface ProxyScore {
  proxy: ProxyData;
  overallScore: number; // 0-100
  metrics: {
    speed: number; // 0-100 (based on response time)
    reliability: number; // 0-100 (based on success rate)
    anonymity: number; // 0-100 (based on anonymity level)
    compatibility: number; // 0-100 (based on sites it works with)
  };
  testResults: ProxyTestResult[];
  lastUpdated: Date;
}

export interface ScraperConfig {
  headless: boolean;
  timeout: number;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  delays: {
    beforeRequest: number;
    afterLoad: number;
    betweenRequests: number;
  };
  retries: number;
  antiDetection: {
    disableAutomationFeatures: boolean;
    bypassCloudflare: boolean;
    randomizeViewport: boolean;
    useProxy: boolean;
  };
}

export interface TesterConfig {
  headless: boolean;
  timeout: number;
  maxRetries: number;
  delayBetweenTests: number;
  logLevel: LogLevel;
  testSites: string[];
  validateConnectivity: boolean;
  checkAnonymity: boolean;
  measureSpeed: boolean;
}

export interface TestSiteConfig {
  name: string;
  url: string;
  expectedSelectors: string[];
  blockedIndicators: string[];
  importance: 'low' | 'medium' | 'high';
  category: 'ecommerce' | 'social' | 'search' | 'general';
}

export interface ExportConfig {
  format: 'json' | 'csv' | 'txt';
  includeMetadata: boolean;
  sortBy: 'score' | 'speed' | 'country' | 'source';
  filterBy?: {
    minScore?: number;
    protocols?: string[];
    countries?: string[];
    workingOnly?: boolean;
  };
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  totalExecutionTime: number;
  scrapingTime: number;
  testingTime: number;
  proxiesExtracted: number;
  proxiesTested: number;
  proxiesWorking: number;
  averageResponseTime: number;
  successRate: number;
} 