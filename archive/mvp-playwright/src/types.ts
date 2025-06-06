export interface ProxyData {
  ip: string;
  port: number;
  protocol: 'http' | 'https';
  country?: string;
  anonymity?: string;
  uptime?: string;
}

export interface ScrapingResult {
  success: boolean;
  proxiesFound: number;
  data: ProxyData[];
  errors: string[];
  cloudflareBypass: boolean;
  pageStructure: {
    hasTable: boolean;
    tableRows: number;
    paginationFound: boolean;
    totalPages?: number;
  };
} 