# Prompt: Servicio de Scraping

## 🎯 Objetivo

Implementar servicios de scraping robustos y responsables para extraer proxies de hide.mn.

## 📋 Especificaciones Técnicas

### Fuente de Datos

- **URL Base**: `https://hide.mn/es/proxy-list/?type=s#list`
- **Paginación**: Detectar automáticamente número total de páginas
- **Estructura**: Tabla HTML con datos de proxies

### Stack Tecnológico

- **HTTP Client**: fetch nativo para requests
- **HTML Parser**: Cheerio para parsing DOM
- **Rate Limiting**: Delays configurables entre requests

## 🔧 Implementación Base

```typescript
interface ScrapingConfig {
  baseUrl: string;
  delay: number;
  timeout: number;
  maxRetries: number;
  userAgent: string;
}

interface ScrapingResult {
  proxies: Proxy[];
  totalPages: number;
  scrapedPages: number;
  errors: string[];
}

class ScraperService {
  private config: ScrapingConfig;
  private abortController?: AbortController;

  constructor(config: Partial<ScrapingConfig> = {}) {
    this.config = {
      baseUrl: "https://hide.mn/es/proxy-list/?type=s",
      delay: 2000,
      timeout: 10000,
      maxRetries: 3,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ...config,
    };
  }

  async scrapeAllPages(
    onProgress?: (progress: ScrapingProgress) => void
  ): Promise<ScrapingResult> {
    // Implementación aquí
  }
}
```

## 🔄 Flujo de Scraping

### 1. Detección de Páginas

```typescript
async detectTotalPages(html: string): Promise<number> {
  const $ = cheerio.load(html);

  // Buscar elementos de paginación
  const paginationLinks = $('.pagination a, .pager a, .page-numbers');

  if (paginationLinks.length === 0) {
    return 1; // Solo una página
  }

  // Extraer números de página
  const pageNumbers = paginationLinks
    .map((_, el) => parseInt($(el).text().trim()))
    .get()
    .filter(num => !isNaN(num));

  return Math.max(...pageNumbers, 1);
}
```

### 2. Extracción de Proxies

```typescript
extractProxiesFromPage(html: string): Proxy[] {
  const $ = cheerio.load(html);
  const proxies: Proxy[] = [];

  // Selectors flexibles para la tabla
  const tableRows = $('table tr, .proxy-list tr, [class*="proxy"] tr');

  tableRows.each((index, row) => {
    const $row = $(row);

    // Extraer IP y puerto
    const ipText = $row.find('td:first-child, .ip').text().trim();
    const portText = $row.find('td:nth-child(2), .port').text().trim();

    // Validar formato IP
    if (this.isValidIP(ipText) && this.isValidPort(portText)) {
      proxies.push({
        ip: ipText,
        port: parseInt(portText),
        protocol: this.detectProtocol($row),
        country: this.extractCountry($row),
        anonymity: this.extractAnonymity($row),
        lastChecked: new Date()
      });
    }
  });

  return proxies;
}
```

### 3. Rate Limiting Inteligente

```typescript
private async smartDelay(pageNumber: number): Promise<void> {
  // Delay base + jitter para evitar patrones
  const baseDelay = this.config.delay;
  const jitter = Math.random() * 1000; // 0-1 segundo adicional
  const adaptiveDelay = pageNumber > 10 ? baseDelay * 1.5 : baseDelay;

  await new Promise(resolve =>
    setTimeout(resolve, adaptiveDelay + jitter)
  );
}
```

## 🚨 Error Handling

### Retry con Backoff Exponencial

```typescript
async fetchWithRetry(url: string, attempt = 1): Promise<string> {
  try {
    const response = await fetch(url, {
      signal: this.abortController?.signal,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    if (attempt >= this.config.maxRetries) {
      throw new Error(`Failed after ${attempt} attempts: ${error.message}`);
    }

    // Backoff exponencial: 2^attempt segundos
    const backoffDelay = Math.pow(2, attempt) * 1000;
    await new Promise(resolve => setTimeout(resolve, backoffDelay));

    return this.fetchWithRetry(url, attempt + 1);
  }
}
```

### Detección de Rate Limiting

```typescript
private detectRateLimit(response: Response): boolean {
  // Status codes comunes de rate limiting
  if ([429, 503, 509].includes(response.status)) {
    return true;
  }

  // Headers de rate limiting
  const rateLimitHeaders = [
    'x-ratelimit-remaining',
    'x-rate-limit-remaining',
    'ratelimit-remaining'
  ];

  for (const header of rateLimitHeaders) {
    if (response.headers[header] === '0') {
      return true;
    }
  }

  return false;
}
```

## 🔍 Validación de Datos

### Validadores

```typescript
private isValidIP(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

private isValidPort(port: string): boolean {
  const portNum = parseInt(port);
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
}

private detectProtocol($row: any): 'http' | 'https' {
  const protocolText = $row.find('.protocol, td:nth-child(3)').text().toLowerCase();
  return protocolText.includes('https') ? 'https' : 'http';
}
```

## 📊 Progress Tracking

```typescript
interface ScrapingProgress {
  currentPage: number;
  totalPages: number;
  proxiesFound: number;
  errorsCount: number;
  percentage: number;
  estimatedTimeRemaining: number;
}

private calculateProgress(
  currentPage: number,
  totalPages: number,
  startTime: number
): ScrapingProgress {
  const percentage = (currentPage / totalPages) * 100;
  const elapsed = Date.now() - startTime;
  const estimatedTotal = elapsed / (currentPage / totalPages);
  const estimatedTimeRemaining = estimatedTotal - elapsed;

  return {
    currentPage,
    totalPages,
    proxiesFound: this.proxiesFound,
    errorsCount: this.errors.length,
    percentage,
    estimatedTimeRemaining
  };
}
```

## ⚡ Optimizaciones

### 1. Abort Controller

```typescript
abort(): void {
  this.abortController?.abort();
  this.abortController = new AbortController();
}
```

### 2. Timeout Control

```typescript
// Fetch con timeout personalizado
async fetchWithTimeout(url: string, timeout: number = this.config.timeout): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': this.config.userAgent
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
```

### 3. Caching Inteligente

```typescript
private cache = new Map<string, { data: string; timestamp: number }>();

private async getCachedOrFetch(url: string): Promise<string> {
  const cached = this.cache.get(url);
  const now = Date.now();

  // Cache válido por 5 minutos
  if (cached && (now - cached.timestamp) < 300000) {
    return cached.data;
  }

  const data = await this.fetchWithRetry(url);
  this.cache.set(url, { data, timestamp: now });

  return data;
}
```

## 🧪 Testing

- Mocks para fetch requests usando MSW (Mock Service Worker)
- Fixtures con HTML de ejemplo
- Tests de rate limiting con bun test
- Validación de parsers con diferentes estructuras DOM
- Setup con `bunx vitest` para testing unitario
