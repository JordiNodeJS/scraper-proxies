import { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright';
import type { 
  ProxyData, 
  ProxyTestResult, 
  TesterConfig,
  LogLevel,
  LogEntry
} from '@scraper-proxies/shared';
import chalk from 'chalk';

/**
 * ProxyTester - Valida proxies en sitios web reales
 * Incluye testing en Amazon, redes sociales y otros sitios populares
 */
export class ProxyTester {
  private browser: Browser | null = null;
  private config: TesterConfig;
  private logs: LogEntry[] = [];

  constructor(config: Partial<TesterConfig> = {}) {
    this.config = {
      headless: false,
      timeout: 15000,
      maxRetries: 2,
      delayBetweenTests: 3000,
      logLevel: 'info',
      testSites: ['amazon', 'google', 'twitter'],
      validateConnectivity: true,
      checkAnonymity: true,
      measureSpeed: true,
      ...config
    };
  }

  /**
   * Inicializar el navegador para testing
   */
  private async initializeBrowser(): Promise<void> {
    try {
      this.log('info', 'Inicializando navegador para testing de proxies...');

      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--disable-extensions-file-access-check',
          '--disable-extensions',
          '--disable-gpu',
          '--no-first-run',
          '--disable-default-apps'
        ]
      });

      this.log('info', 'Navegador de testing inicializado exitosamente');
    } catch (error) {
      this.log('error', `Error inicializando navegador: ${error}`);
      throw error;
    }
  }

  /**
   * Probar un proxy individual en múltiples sitios
   */
  public async testProxy(proxy: ProxyData): Promise<ProxyTestResult> {
    const startTime = Date.now();
    let browser: Browser | null = null;
    
    this.log('info', `Iniciando test de proxy: ${proxy.ip}:${proxy.port}`);

    const result: ProxyTestResult = {
      proxy,
      isWorking: false,
      responseTime: 0,
      anonymityLevel: 'unknown',
      testResults: {},
      errors: [],
      testedAt: new Date(),
      testDuration: 0
    };

    try {
      // Crear browser con configuración de proxy
      browser = await chromium.launch({
        headless: this.config.headless,
        proxy: {
          server: `${proxy.protocol}://${proxy.ip}:${proxy.port}`
        },
        args: [
          '--no-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--disable-web-security'
        ]
      });

      // Configurar context con headers realistas
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'America/New_York'
      });

      const page = await context.newPage();

      // Test básico de conectividad
      if (this.config.validateConnectivity) {
        const connectivityResult = await this.testConnectivity(page);
        result.testResults.connectivity = connectivityResult;
        
        if (!connectivityResult.success) {
          result.errors.push('Fallo en test de conectividad básica');
          return result;
        }
      }

      // Test de anonimato
      if (this.config.checkAnonymity) {
        const anonymityResult = await this.testAnonymity(page);
        result.testResults.anonymity = anonymityResult;
        result.anonymityLevel = anonymityResult.level || 'unknown';
      }

      // Test en sitios específicos
      for (const site of this.config.testSites) {
        this.log('info', `Testing ${proxy.ip}:${proxy.port} en ${site}...`);
        
        try {
          const siteResult = await this.testSite(page, site);
          result.testResults[site] = siteResult;
          
          if (siteResult.success) {
            result.isWorking = true;
          }
        } catch (error) {
          const errorMsg = `Error testing ${site}: ${error}`;
          result.errors.push(errorMsg);
          result.testResults[site] = {
            success: false,
            responseTime: 0,
            statusCode: 0,
            error: errorMsg
          };
        }

        // Delay entre tests
        await this.delay(this.config.delayBetweenTests);
      }

      // Calcular tiempo de respuesta promedio
      const successfulTests = Object.values(result.testResults)
        .filter(test => test.success && test.responseTime > 0);
      
      if (successfulTests.length > 0) {
        result.responseTime = Math.round(
          successfulTests.reduce((sum, test) => sum + test.responseTime, 0) / successfulTests.length
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error general testing proxy ${proxy.ip}:${proxy.port}: ${errorMessage}`);
      result.errors.push(errorMessage);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    result.testDuration = Date.now() - startTime;
    
    this.log('info', `Test completado para ${proxy.ip}:${proxy.port}`, {
      working: result.isWorking,
      responseTime: result.responseTime,
      errors: result.errors.length
    });

    return result;
  }

  /**
   * Test de conectividad básica
   */
  private async testConnectivity(page: Page): Promise<any> {
    const startTime = Date.now();

    try {
      // Test con httpbin.org para verificar conectividad básica
      const response = await page.goto('https://httpbin.org/ip', {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout
      });

      const responseTime = Date.now() - startTime;

      if (response && response.ok()) {
        const content = await page.textContent('body');
        const ipMatch = content?.match(/"origin":\s*"([^"]+)"/);
        
        return {
          success: true,
          responseTime,
          statusCode: response.status(),
          detectedIP: ipMatch ? ipMatch[1] : 'unknown'
        };
      } else {
        return {
          success: false,
          responseTime,
          statusCode: response?.status() || 0,
          error: 'Response not OK'
        };
      }
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        statusCode: 0,
        error: String(error)
      };
    }
  }

  /**
   * Test de nivel de anonimato
   */
  private async testAnonymity(page: Page): Promise<any> {
    try {
      // Usar método simple con httpbin.org para detectar headers de proxy
      const response = await page.goto('https://httpbin.org/headers', {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout
      });

      if (response && response.ok()) {
        const content = await page.textContent('body');
        
        if (content) {
          const hasProxyHeaders = content.includes('X-Forwarded-For') || 
                                 content.includes('X-Real-IP') ||
                                 content.includes('Via') ||
                                 content.includes('Proxy-');

          const level = hasProxyHeaders ? 'transparent' : 'anonymous';

          return {
            success: true,
            level,
            details: { hasProxyHeaders, content: content.substring(0, 500) }
          };
        }
      }
    } catch (error) {
      // Fallback simple
      return {
        success: false,
        level: 'unknown',
        error: String(error)
      };
    }

    return {
      success: false,
      level: 'unknown',
      error: 'No se pudo determinar el nivel de anonimato'
    };
  }

  /**
   * Test en sitio específico
   */
  private async testSite(page: Page, site: string): Promise<any> {
    const startTime = Date.now();

    try {
      let url: string;
      let expectedElement: string;

      // Configurar URL y elemento esperado según el sitio
      switch (site.toLowerCase()) {
        case 'amazon':
          url = 'https://www.amazon.com';
          expectedElement = '#nav-logo-sprites, .nav-logo-link, a[aria-label="Amazon"]';
          break;
        case 'google':
          url = 'https://www.google.com';
          expectedElement = 'input[name="q"], .gLFyf, textarea[name="q"]';
          break;
        case 'twitter':
        case 'x':
          url = 'https://twitter.com';
          expectedElement = 'header, [data-testid="primaryColumn"], h1';
          break;
        case 'instagram':
          url = 'https://www.instagram.com';
          expectedElement = 'article, .login-form, input[name="username"]';
          break;
        case 'facebook':
          url = 'https://www.facebook.com';
          expectedElement = '#email, [data-testid="royal_email"], input[name="email"]';
          break;
        case 'youtube':
          url = 'https://www.youtube.com';
          expectedElement = '#logo, ytd-masthead, .ytd-topbar-logo-renderer';
          break;
        case 'httpbin':
          url = 'https://httpbin.org/';
          expectedElement = 'body, h1, .description';
          break;
        default:
          throw new Error(`Sitio no soportado: ${site}`);
      }

      this.log('debug', `Accediendo a ${url}...`);

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout
      });

      const responseTime = Date.now() - startTime;

      if (!response) {
        throw new Error('No response received');
      }

      const statusCode = response.status();

      // Verificar que el sitio cargó correctamente
      if (statusCode >= 400) {
        return {
          success: false,
          responseTime,
          statusCode,
          error: `HTTP ${statusCode}`
        };
      }

      // Verificar que el elemento esperado está presente
      try {
        await page.waitForSelector(expectedElement, { timeout: 5000 });
        
        return {
          success: true,
          responseTime,
          statusCode,
          elementFound: true
        };
      } catch (elementError) {
        // El sitio cargó pero no encontramos el elemento esperado
        // Esto podría indicar bloqueo o página diferente
        
        // Para sitios que pueden tener CAPTCHAs o bloqueos, verificar título
        const title = await page.title();
        const bodyText = await page.textContent('body');
        
        const hasBlockingIndicators = title.toLowerCase().includes('captcha') ||
                                    title.toLowerCase().includes('blocked') ||
                                    bodyText?.toLowerCase().includes('blocked') ||
                                    bodyText?.toLowerCase().includes('captcha');

        return {
          success: false,
          responseTime,
          statusCode,
          elementFound: false,
          hasBlockingIndicators,
          title,
          error: hasBlockingIndicators ? 'Sitio bloqueado/CAPTCHA detectado' : 'Elemento esperado no encontrado'
        };
      }

    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        statusCode: 0,
        error: String(error)
      };
    }
  }

  /**
   * Probar múltiples proxies
   */
  public async testMultipleProxies(proxies: ProxyData[]): Promise<ProxyTestResult[]> {
    this.log('info', `Iniciando test de ${proxies.length} proxies...`);
    
    const results: ProxyTestResult[] = [];
    let workingCount = 0;

    for (let i = 0; i < proxies.length; i++) {
      const proxy = proxies[i];
      
      this.log('info', `Testing proxy ${i + 1}/${proxies.length}: ${proxy.ip}:${proxy.port}`);
      
      try {
        const result = await this.testProxy(proxy);
        results.push(result);
        
        if (result.isWorking) {
          workingCount++;
          this.log('info', `✅ Proxy funcional: ${proxy.ip}:${proxy.port} (${result.responseTime}ms)`);
        } else {
          this.log('warn', `❌ Proxy no funcional: ${proxy.ip}:${proxy.port}`);
        }
      } catch (error) {
        this.log('error', `Error testing ${proxy.ip}:${proxy.port}: ${error}`);
        
        // Crear resultado de error
        results.push({
          proxy,
          isWorking: false,
          responseTime: 0,
          anonymityLevel: 'unknown',
          testResults: {},
          errors: [String(error)],
          testedAt: new Date(),
          testDuration: 0
        });
      }

      // Delay entre proxies para evitar rate limiting
      if (i < proxies.length - 1) {
        await this.delay(this.config.delayBetweenTests);
      }
    }

    this.log('info', `Testing completado: ${workingCount}/${proxies.length} proxies funcionales`);
    return results;
  }

  /**
   * Delay utilitario
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log con colores y timestamp
   */
  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
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
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.log('info', 'Navegador de testing cerrado');
  }

  /**
   * Obtener logs
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }
} 