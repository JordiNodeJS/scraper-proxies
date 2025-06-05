export interface ProxyData {
  ip: string;
  port: number;
  protocol: 'http' | 'https';
  country?: string;
  anonymity?: string;
  uptime?: string;
}

export interface ScrapingSession {
  success: boolean;
  proxiesFound: number;
  data: ProxyData[];
  errors: string[];
  userInteractionRequired: boolean;
  cloudflareDetected: boolean;
  manualStepsCompleted: boolean;
  sessionDuration: number;
  pageStructure: {
    hasTable: boolean;
    tableRows: number;
    paginationFound: boolean;
    totalPages?: number;
  };
}

export interface UserAction {
  type: 'CAPTCHA_COMPLETED' | 'MANUAL_NAVIGATION' | 'ABORT_SESSION';
  timestamp: number;
  message?: string;
} 