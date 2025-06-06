/**
 * Tipos para el detector de sitios web con Playwright
 */

export interface WebsiteTarget {
  name: string;
  url: string;
  description: string;
  category: 'ecommerce' | 'social' | 'search' | 'entertainment' | 'news' | 'tech' | 'academic' | 'government' | 'proxy';
  expectedSelectors: string[];
  blockedIndicators: string[];
  riskLevel: 'excellent' | 'low' | 'medium' | 'high';
}

export interface DetectionResult {
  website: WebsiteTarget;
  accessible: boolean;
  blocked: boolean;
  hasCloudflare: boolean;
  hasCaptcha: boolean;
  hasRateLimit: boolean;
  responseTime: number;
  statusCode: number | null;
  userAgent: string;
  screenshots: {
    success?: string;
    blocked?: string;
  };
  detectedProtections: string[];
  scrapingViability: 'excellent' | 'good' | 'difficult' | 'impossible';
  notes: string[];
  error?: string;
  timestamp: Date;
}

export interface DetectionConfig {
  headless: boolean;
  timeout: number;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  waitForNetworkIdle: boolean;
  retries: number;
  screenshotOnBlock: boolean;
  bypassCloudflare: boolean;
}

export interface DetectionSummary {
  totalTested: number;
  accessible: number;
  blocked: number;
  withCloudflare: number;
  withCaptcha: number;
  withRateLimit: number;
  viabilityBreakdown: Record<DetectionResult['scrapingViability'], number>;
  categoryBreakdown: Record<WebsiteTarget['category'], {
    total: number;
    accessible: number;
    blocked: number;
  }>;
  averageResponseTime: number;
  recommendations: string[];
  timestamp: Date;
}

export interface UserAgentConfig {
  name: string;
  value: string;
  description: string;
} 