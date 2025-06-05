import { Browser, BrowserContext, Page, chromium } from 'playwright';
import type { 
  ScraperConfig, 
  ProxyData, 
  ScrapingResult, 
  LogLevel,
  LogEntry 
} from '../types/proxy.types.js';
import chalk from 'chalk';

/**
 * Clase base para scraping de proxies con configuración anti-detección
 * Optimizada para sitios protegidos por Cloudflare
 */
export abstract class ProxyScraper {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected config: ScraperConfig;
  private logs: LogEntry[] = [];

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      headless: false,
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: {
        width: 1920,
        height: 1080
      },
      delays: {
        beforeRequest: 2000,
        afterLoad: 3000,
        betweenRequests: 5000
      },
      retries: 3,
      antiDetection: {
        disableAutomationFeatures: true,
        bypassCloudflare: true,
        randomizeViewport: true,
        useProxy: false
      },
      ...config
    };
  }

  /**
   * Inicializar el navegador con configuración anti-detección
   */
  protected async initializeBrowser(): Promise<void> {
    this.log('info', 'Inicializando navegador con configuración anti-detección');

    const browserArgs = [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-web-security',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection'
    ];

    if (this.config.antiDetection.disableAutomationFeatures) {
      browserArgs.push(
        '--disable-automation',
        '--exclude-switches=enable-automation',
        '--disable-blink-features=AutomationControlled'
      );
    }

    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: browserArgs,
      timeout: this.config.timeout
    });

    this.context = await this.browser.newContext({
      userAgent: this.config.userAgent,
      viewport: this.getRandomizedViewport(),
      // Simular headers de navegador real
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    });

    // Agregar script para ocultar características de automatización
    await this.context.addInitScript(() => {
      // Eliminar webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Sobrescribir plugins y languages
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Simular Chrome runtime
      (window as any).chrome = {
        runtime: {},
      };

      // Mock de permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: 'granted' } as PermissionStatus) :
          originalQuery(parameters)
      );
    });

    this.page = await this.context.newPage();
    
    // Configurar timeouts
    this.page.setDefaultTimeout(this.config.timeout);
    this.page.setDefaultNavigationTimeout(this.config.timeout);

    this.log('info', 'Navegador inicializado exitosamente');
  }

  /**
   * Generar viewport aleatorizado para evitar detección
   */
  private getRandomizedViewport(): { width: number; height: number } {
    if (!this.config.antiDetection.randomizeViewport) {
      return this.config.viewport;
    }

    const baseWidth = this.config.viewport.width;
    const baseHeight = this.config.viewport.height;
    
    return {
      width: baseWidth + Math.floor(Math.random() * 100) - 50,
      height: baseHeight + Math.floor(Math.random() * 100) - 50
    };
  }

  /**
   * Navegar a una URL con gestión de Cloudflare
   */
  protected async navigateWithCloudflareHandling(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser no inicializado');
    }

    this.log('info', `Navegando a: ${url}`);

    // Delay inicial para evitar detección
    await this.delay(this.config.delays.beforeRequest);

    try {
      const response = await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout
      });

      if (!response) {
        throw new Error('No se recibió respuesta del servidor');
      }

      // Verificar si Cloudflare está presente
      const isCloudflare = await this.detectCloudflare();
      
      if (isCloudflare) {
        this.log('warn', 'Cloudflare detectado, esperando challenge...');
        await this.handleCloudflareChallenge();
      }

      // Esperar a que la página se cargue completamente
      await this.delay(this.config.delays.afterLoad);

      this.log('info', `Navegación completada. Status: ${response.status()}`);

    } catch (error) {
      this.log('error', `Error navegando a ${url}: ${error}`);
      throw error;
    }
  }

  /**
   * Detectar si Cloudflare está presente en la página
   */
  private async detectCloudflare(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const cloudflareIndicators = [
        'text=Checking your browser',
        'text=Please wait',
        'text=DDoS protection',
        '[data-ray]',
        '.cf-wrapper',
        '#cf-wrapper',
        '.cf-browser-verification'
      ];

      for (const selector of cloudflareIndicators) {
        const element = await this.page.$(selector);
        if (element) {
          return true;
        }
      }

      // Verificar en el título
      const title = await this.page.title();
      if (title.includes('Cloudflare') || title.includes('Please wait')) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Manejar challenge de Cloudflare
   */
  private async handleCloudflareChallenge(): Promise<void> {
    if (!this.page) return;

    const maxWaitTime = 30000; // 30 segundos máximo
    const startTime = Date.now();

    this.log('info', 'Esperando que Cloudflare complete el challenge...');

    while (Date.now() - startTime < maxWaitTime) {
      // Esperar un poco antes de verificar nuevamente
      await this.delay(2000);

      const stillHasCloudflare = await this.detectCloudflare();
      
      if (!stillHasCloudflare) {
        this.log('info', 'Challenge de Cloudflare completado');
        return;
      }

      // Verificar si hay algún botón o checkbox que necesite interacción
      try {
        const verifyButton = await this.page.$('input[type="checkbox"]');
        if (verifyButton) {
          await verifyButton.click();
          await this.delay(3000);
        }
      } catch {
        // Ignorar errores de interacción
      }
    }

    this.log('warn', 'Timeout esperando Cloudflare challenge');
  }

  /**
   * Delay utilitario
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log con colores y timestamp
   */
  protected log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.constructor.name,
      ...(data && { data })
    };

    this.logs.push(entry);

    // Console output con colores
    const timestamp = entry.timestamp.toISOString().substr(11, 8);
    const prefix = `[${timestamp}] [${this.constructor.name}]`;
    
    switch (level) {
      case 'debug':
        console.log(chalk.gray(`${prefix} 🔍 ${message}`));
        break;
      case 'info':
        console.log(chalk.blue(`${prefix} ℹ️ ${message}`));
        break;
      case 'warn':
        console.log(chalk.yellow(`${prefix} ⚠️ ${message}`));
        break;
      case 'error':
        console.log(chalk.red(`${prefix} ❌ ${message}`));
        break;
    }

    if (data) {
      console.log(chalk.gray('  Data:'), data);
    }
  }

  /**
   * Cerrar navegador
   */
  public async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.log('info', 'Navegador cerrado');
  }

  /**
   * Obtener logs generados
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Limpiar logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Método abstracto que deben implementar las clases hijas
   */
  public abstract scrapeProxies(): Promise<ScrapingResult>;

  /**
   * Método de conveniencia para inicializar y scraping
   */
  public async run(): Promise<ScrapingResult> {
    try {
      await this.initializeBrowser();
      const result = await this.scrapeProxies();
      return result;
    } finally {
      await this.close();
    }
  }
} 