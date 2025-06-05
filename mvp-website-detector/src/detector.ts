import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import type { 
  WebsiteTarget, 
  DetectionResult, 
  DetectionConfig, 
  DetectionSummary 
} from './types.js';
import { USER_AGENTS } from './websites.js';
import chalk from 'chalk';

/**
 * Detector de sitios web con Playwright
 * Analiza qué tan accesibles son los sitios para scraping
 */
export class WebsiteDetector {
  private browser: Browser | null = null;
  private config: DetectionConfig;

  constructor(config: Partial<DetectionConfig> = {}) {
    this.config = {
      headless: config.headless ?? false,
      timeout: config.timeout ?? 15000,
      userAgent: config.userAgent ?? USER_AGENTS[0].value,
      viewport: config.viewport ?? { width: 1920, height: 1080 },
      waitForNetworkIdle: config.waitForNetworkIdle ?? true,
      retries: config.retries ?? 2,
      screenshotOnBlock: config.screenshotOnBlock ?? true,
      bypassCloudflare: config.bypassCloudflare ?? false
    };
  }

  /**
   * Inicializa el browser de Playwright
   */
  async initialize(): Promise<void> {
    console.log(chalk.blue('🚀 Inicializando Playwright...'));
    
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    console.log(chalk.green('✅ Browser iniciado exitosamente'));
  }

  /**
   * Cierra el browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log(chalk.gray('🔒 Browser cerrado'));
    }
  }

  /**
   * Crea un contexto de browser con configuración específica
   */
  private async createContext(): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('Browser no inicializado. Llama a initialize() primero.');
    }

    const context = await this.browser.newContext({
      userAgent: this.config.userAgent,
      viewport: this.config.viewport,
      ignoreHTTPSErrors: true,
      bypassCSP: true
    });

    // Configurar timeouts
    context.setDefaultTimeout(this.config.timeout);
    context.setDefaultNavigationTimeout(this.config.timeout);

    return context;
  }

  /**
   * Detecta las protecciones de un sitio web específico
   */
  async detectWebsite(website: WebsiteTarget): Promise<DetectionResult> {
    const startTime = Date.now();
    console.log(chalk.yellow(`🔍 Analizando: ${website.name} (${website.url})`));

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      context = await this.createContext();
      page = await context.newPage();

      // Navegar al sitio
      const response = await page.goto(website.url, {
        waitUntil: this.config.waitForNetworkIdle ? 'networkidle' : 'domcontentloaded',
        timeout: this.config.timeout
      });

      const responseTime = Date.now() - startTime;
      const statusCode = response?.status() ?? null;

      // Esperar un poco para que la página se cargue completamente
      await page.waitForTimeout(2000);

      // Analizar contenido de la página
      const result = await this.analyzePage(page, website, responseTime, statusCode);
      
      console.log(chalk.green(`✅ ${website.name}: ${result.scrapingViability.toUpperCase()}`));
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(chalk.red(`❌ ${website.name}: ERROR - ${error}`));
      
      return {
        website,
        accessible: false,
        blocked: true,
        hasCloudflare: false,
        hasCaptcha: false,
        hasRateLimit: false,
        responseTime,
        statusCode: null,
        userAgent: this.config.userAgent,
        screenshots: {},
        detectedProtections: ['connection_error'],
        scrapingViability: 'impossible',
        notes: [`Error de conexión: ${error}`],
        error: String(error),
        timestamp: new Date()
      };
    } finally {
      if (page) await page.close();
      if (context) await context.close();
    }
  }

  /**
   * Analiza una página cargada para detectar protecciones
   */
  private async analyzePage(
    page: Page, 
    website: WebsiteTarget, 
    responseTime: number, 
    statusCode: number | null
  ): Promise<DetectionResult> {
    const detectedProtections: string[] = [];
    const notes: string[] = [];
    let accessible = true;
    let blocked = false;
    let hasCloudflare = false;
    let hasCaptcha = false;
    let hasRateLimit = false;

    // Obtener título y URL actual
    const title = await page.title();
    const currentUrl = page.url();
    
    notes.push(`Título: "${title}"`);
    if (currentUrl !== website.url) {
      notes.push(`Redirigido a: ${currentUrl}`);
    }

    // Verificar si la página se cargó correctamente
    const pageContent = await page.content();
    
    // Detectar Cloudflare
    if (pageContent.includes('cloudflare') || 
        pageContent.includes('cf-ray') ||
        title.includes('Cloudflare') ||
        currentUrl.includes('cdn-cgi')) {
      hasCloudflare = true;
      detectedProtections.push('cloudflare');
      notes.push('🛡️ Cloudflare detectado');
    }

    // Detectar CAPTCHA
    if (pageContent.includes('captcha') ||
        pageContent.includes('recaptcha') ||
        pageContent.includes('hcaptcha') ||
        title.toLowerCase().includes('captcha')) {
      hasCaptcha = true;
      detectedProtections.push('captcha');
      notes.push('🤖 CAPTCHA detectado');
    }

    // Detectar rate limiting
    if (pageContent.includes('rate limit') ||
        pageContent.includes('too many requests') ||
        pageContent.includes('unusual traffic') ||
        statusCode === 429) {
      hasRateLimit = true;
      detectedProtections.push('rate_limit');
      notes.push('⏳ Rate limiting detectado');
    }

    // Verificar indicadores de bloqueo específicos del sitio
    for (const indicator of website.blockedIndicators) {
      try {
        const element = await page.locator(indicator).first();
        if (await element.isVisible({ timeout: 1000 })) {
          blocked = true;
          detectedProtections.push('site_specific_block');
          notes.push(`🚫 Indicador de bloqueo detectado: ${indicator}`);
          break;
        }
      } catch {
        // El selector no se encontró, continuar
      }
    }

    // Verificar si los elementos esperados están presentes
    let foundExpectedElements = 0;
    for (const selector of website.expectedSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          foundExpectedElements++;
        }
      } catch {
        // El selector no se encontró
      }
    }

    const expectedElementsRatio = foundExpectedElements / website.expectedSelectors.length;
    notes.push(`✅ Elementos esperados encontrados: ${foundExpectedElements}/${website.expectedSelectors.length} (${Math.round(expectedElementsRatio * 100)}%)`);

    // Si no encontramos elementos esperados, probablemente estamos bloqueados
    if (expectedElementsRatio < 0.3) {
      blocked = true;
      accessible = false;
      detectedProtections.push('missing_expected_elements');
      notes.push('❌ Muy pocos elementos esperados encontrados - posible bloqueo');
    }

    // Determinar viabilidad de scraping
    let scrapingViability: DetectionResult['scrapingViability'];
    
    if (blocked || hasCaptcha || (hasRateLimit && hasCloudflare)) {
      scrapingViability = 'impossible';
    } else if (hasCloudflare || hasRateLimit || expectedElementsRatio < 0.7) {
      scrapingViability = 'difficult';
    } else if (expectedElementsRatio > 0.8 && detectedProtections.length === 0) {
      scrapingViability = 'excellent';
    } else {
      scrapingViability = 'good';
    }

    // Tomar screenshot si está bloqueado
    const screenshots: DetectionResult['screenshots'] = {};
    if (this.config.screenshotOnBlock && (blocked || hasCaptcha)) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `blocked-${website.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.png`;
        await page.screenshot({ 
          path: `screenshots/${filename}`,
          fullPage: true 
        });
        screenshots.blocked = filename;
        notes.push(`📸 Screenshot guardado: ${filename}`);
      } catch (error) {
        notes.push(`❌ Error al tomar screenshot: ${error}`);
      }
    }

    return {
      website,
      accessible,
      blocked,
      hasCloudflare,
      hasCaptcha,
      hasRateLimit,
      responseTime,
      statusCode,
      userAgent: this.config.userAgent,
      screenshots,
      detectedProtections,
      scrapingViability,
      notes,
      timestamp: new Date()
    };
  }

  /**
   * Detecta múltiples sitios web y genera un resumen
   */
  async detectMultipleWebsites(websites: WebsiteTarget[]): Promise<{
    results: DetectionResult[];
    summary: DetectionSummary;
  }> {
    console.log(chalk.blue(`🎯 Iniciando análisis de ${websites.length} sitios web...`));
    
    const results: DetectionResult[] = [];
    
    for (const website of websites) {
      try {
        const result = await this.detectWebsite(website);
        results.push(result);
        
        // Pausa entre sitios para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(chalk.red(`❌ Error procesando ${website.name}: ${error}`));
      }
    }

    const summary = this.generateSummary(results);
    return { results, summary };
  }

  /**
   * Genera un resumen estadístico de los resultados
   */
  private generateSummary(results: DetectionResult[]): DetectionSummary {
    const summary: DetectionSummary = {
      totalTested: results.length,
      accessible: results.filter(r => r.accessible).length,
      blocked: results.filter(r => r.blocked).length,
      withCloudflare: results.filter(r => r.hasCloudflare).length,
      withCaptcha: results.filter(r => r.hasCaptcha).length,
      withRateLimit: results.filter(r => r.hasRateLimit).length,
      viabilityBreakdown: {
        excellent: results.filter(r => r.scrapingViability === 'excellent').length,
        good: results.filter(r => r.scrapingViability === 'good').length,
        difficult: results.filter(r => r.scrapingViability === 'difficult').length,
        impossible: results.filter(r => r.scrapingViability === 'impossible').length
      },
      categoryBreakdown: {} as Record<WebsiteTarget['category'], {
        total: number;
        accessible: number;
        blocked: number;
      }>,
      averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
      recommendations: [],
      timestamp: new Date()
    };

    // Calcular breakdown por categoría
    const categories = [...new Set(results.map(r => r.website.category))];
    for (const category of categories) {
      const categoryResults = results.filter(r => r.website.category === category);
      summary.categoryBreakdown[category] = {
        total: categoryResults.length,
        accessible: categoryResults.filter(r => r.accessible).length,
        blocked: categoryResults.filter(r => r.blocked).length
      };
    }

    // Generar recomendaciones
    if (summary.withCloudflare > summary.totalTested * 0.5) {
      summary.recommendations.push('🛡️ Más del 50% de sitios usan Cloudflare - considera usar proxies residenciales');
    }
    
    if (summary.withCaptcha > 0) {
      summary.recommendations.push('🤖 Detectados CAPTCHAs - implementar servicios de resolución automática');
    }
    
    if (summary.viabilityBreakdown.excellent > 0) {
      summary.recommendations.push('✅ Algunos sitios son fáciles de scrapear - prioriza estos para MVPs');
    }
    
    if (summary.viabilityBreakdown.impossible > summary.totalTested * 0.3) {
      summary.recommendations.push('⚠️ Muchos sitios son difíciles - considera arquitectura distribuida');
    }

    return summary;
  }
} 