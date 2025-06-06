import { chromium } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import type { ProxyData, ScrapingSession, UserAction } from './types.js';
import { UserInterface } from './user-interface.js';
import { isValidIP, isValidPort, detectProtocol, cleanText } from './utils.js';

export class HybridScraper {
  private browser?: Browser;
  private page?: Page;
  private session: ScrapingSession;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.session = {
      success: false,
      proxiesFound: 0,
      data: [],
      errors: [],
      userInteractionRequired: false,
      cloudflareDetected: false,
      manualStepsCompleted: false,
      sessionDuration: 0,
      pageStructure: {
        hasTable: false,
        tableRows: 0,
        paginationFound: false
      }
    };
  }

  async initBrowser(): Promise<void> {
    UserInterface.showStatus('Iniciando navegador con configuración híbrida');
    
    this.browser = await chromium.launch({
      headless: false, // SIEMPRE visible para intervención del usuario
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    }).then(context => context.newPage());

    // Remover señales de automatización
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
  }

  async navigateToTarget(): Promise<boolean> {
    try {
      UserInterface.showStatus('Navegando a hide.mn/proxy-list');
      
      const response = await this.page!.goto('https://hide.mn/es/proxy-list/?type=s#list', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      UserInterface.showStatus(`Respuesta del servidor: ${response?.status()}`);
      
      // Esperar un poco para que cargue el contenido
      await this.page!.waitForTimeout(3000);

      return true;
    } catch (error) {
      this.session.errors.push(`Error de navegación: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async detectCloudflare(): Promise<boolean> {
    try {
      const title = await this.page!.title();
      const url = this.page!.url();
      
      UserInterface.showStatus(`Página cargada: ${title}`);
      UserInterface.showStatus(`URL actual: ${url}`);

      // Detectar challenges de Cloudflare
      const cloudflareIndicators = await this.page!.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        const titleText = document.title.toLowerCase();
        
        return {
          hasJustAMoment: titleText.includes('just a moment'),
          hasCheckingBrowser: bodyText.includes('checking your browser'),
          hasCloudflareText: bodyText.includes('cloudflare'),
          hasVerifyHuman: bodyText.includes('verify you are human'),
          hasTurnstile: !!document.querySelector('[data-cf-turnstile-response]') || 
                       !!document.querySelector('#cf-chl-widget') ||
                       bodyText.includes('turnstile'),
          hasCaptcha: bodyText.includes('captcha') || bodyText.includes('complete the action'),
          bodyTextSample: bodyText.substring(0, 200)
        };
      });

      console.log('🔍 Indicadores de Cloudflare detectados:', cloudflareIndicators);

      if (cloudflareIndicators.hasJustAMoment || 
          cloudflareIndicators.hasCheckingBrowser || 
          cloudflareIndicators.hasVerifyHuman ||
          cloudflareIndicators.hasTurnstile ||
          cloudflareIndicators.hasCaptcha) {
        
        this.session.cloudflareDetected = true;
        return true;
      }

      return false;
    } catch (error) {
      this.session.errors.push(`Error detectando Cloudflare: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async handleUserIntervention(): Promise<boolean> {
    this.session.userInteractionRequired = true;
    
    UserInterface.showCloudflareDetected();
    
    let userAction: UserAction;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      userAction = UserInterface.waitForUserAction();
      
      if (userAction.type === 'ABORT_SESSION') {
        UserInterface.showStatus('Sesión cancelada por el usuario', 'warning');
        return false;
      }

      if (userAction.type === 'CAPTCHA_COMPLETED' || userAction.type === 'MANUAL_NAVIGATION') {
        UserInterface.showStatus('Verificando si el CAPTCHA fue completado...');
        
        // Esperar un poco y verificar si ya no hay Cloudflare
        await this.page!.waitForTimeout(2000);
        
        const stillHasCloudflare = await this.detectCloudflare();
        
        if (!stillHasCloudflare) {
          UserInterface.showStatus('¡CAPTCHA completado exitosamente!', 'success');
          this.session.manualStepsCompleted = true;
          return true;
        } else {
          attempts++;
          UserInterface.showStatus(`Aún se detecta Cloudflare. Intento ${attempts}/${maxAttempts}`, 'warning');
          
          if (attempts < maxAttempts) {
            UserInterface.showStatus('Por favor, verifica que el CAPTCHA esté completo y la página cargada');
          }
        }
      }
    }

    UserInterface.showStatus('No se pudo completar la verificación después de 3 intentos', 'error');
    return false;
  }

  async extractProxies(): Promise<ProxyData[]> {
    try {
      UserInterface.showStatus('Extrayendo datos de proxies...');
      
      // Obtener HTML actual
      const html = await this.page!.content();
      writeFileSync('results/hybrid-page-content.html', html);
      
      const $ = cheerio.load(html);
      
      // Analizar estructura de página
      this.analyzePageStructure($);
      
      // Múltiples estrategias de extracción
      const proxies = this.extractProxiesFromMultipleSources($);
      
      UserInterface.showStatus(`Proxies extraídos: ${proxies.length}`, 'success');
      
      return proxies;
    } catch (error) {
      this.session.errors.push(`Error extrayendo proxies: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private analyzePageStructure($: cheerio.CheerioAPI): void {
    // Buscar tablas
    const tables = $('table');
    console.log(`📋 Tablas encontradas: ${tables.length}`);
    
    if (tables.length > 0) {
      this.session.pageStructure.hasTable = true;
      
      tables.each((i, table) => {
        const $table = $(table);
        const rows = $table.find('tr');
        console.log(`   Tabla ${i + 1}: ${rows.length} filas`);
        
        if (rows.length > this.session.pageStructure.tableRows) {
          this.session.pageStructure.tableRows = rows.length;
        }
      });
    }

    // Buscar paginación
    const paginationSelectors = ['.pagination', '.pager', '.page-numbers', '[class*="page"]'];
    
    for (const selector of paginationSelectors) {
      const paginationEl = $(selector);
      if (paginationEl.length > 0) {
        this.session.pageStructure.paginationFound = true;
        console.log(`📄 Paginación encontrada: ${selector}`);
        break;
      }
    }
  }

  private extractProxiesFromMultipleSources($: cheerio.CheerioAPI): ProxyData[] {
    const proxies: ProxyData[] = [];
    
    // Estrategia 1: Tablas tradicionales
    const tableSelectors = ['table tr', 'tbody tr', '.proxy-list tr', '.list-group-item'];
    
    for (const selector of tableSelectors) {
      console.log(`🔍 Probando selector: ${selector}`);
      
      $(selector).each((index, element) => {
        if (index === 0) return; // Skip header
        
        const $row = $(element);
        const cells = $row.find('td, .col, .column');
        
        if (cells.length >= 2) {
                     const ipText = cleanText($(cells[0]).text());
           const portText = cleanText($(cells[1]).text());
           
           console.log(`   Candidato: ${ipText}:${portText}`);
           
           if (isValidIP(ipText) && isValidPort(portText)) {
             const proxy: ProxyData = {
               ip: ipText,
               port: parseInt(portText),
               protocol: detectProtocol($row.text()),
               country: cells.length > 2 ? cleanText($(cells[2]).text() || '') || undefined : undefined,
               anonymity: cells.length > 3 ? cleanText($(cells[3]).text() || '') || undefined : undefined
             };
            
            proxies.push(proxy);
            console.log(`   ✅ Proxy válido agregado: ${proxy.ip}:${proxy.port}`);
          }
        }
      });
      
      if (proxies.length > 0) {
        console.log(`✅ Encontrados ${proxies.length} proxies con selector: ${selector}`);
        break;
      }
    }

    // Estrategia 2: Buscar patrones IP:PORT en texto
    if (proxies.length === 0) {
      console.log('🔍 Buscando patrones IP:PORT en todo el texto...');
      
      const allText = $('body').text();
      const ipPortPattern = /\b(?:\d{1,3}\.){3}\d{1,3}:\d{1,5}\b/g;
      const matches = allText.match(ipPortPattern);
      
      if (matches) {
        console.log(`   Encontrados ${matches.length} patrones IP:PORT`);
        
        matches.forEach(match => {
          const [ip, portStr] = match.split(':');
          const port = parseInt(portStr);
          
          if (isValidIP(ip) && isValidPort(port)) {
            proxies.push({
              ip,
              port,
              protocol: 'http', // Asumir HTTP por defecto
            });
          }
        });
      }
    }
    
    return proxies;
  }

  async runHybridSession(): Promise<ScrapingSession> {
    try {
      UserInterface.showWelcome();
      
      // Inicializar browser
      await this.initBrowser();
      
      // Navegar al sitio
      const navigationSuccess = await this.navigateToTarget();
      if (!navigationSuccess) {
        throw new Error('Falló la navegación inicial');
      }
      
      // Detectar Cloudflare
      const hasCloudflare = await this.detectCloudflare();
      
      if (hasCloudflare) {
        UserInterface.showStatus('Cloudflare detectado, requiere intervención manual', 'warning');
        
        const userSuccess = await this.handleUserIntervention();
        if (!userSuccess) {
          throw new Error('Usuario canceló o falló la intervención manual');
        }
      } else {
        UserInterface.showStatus('No se detectó Cloudflare, continuando automáticamente', 'success');
      }
      
      // Extraer proxies
      const proxies = await this.extractProxies();
      
      // Completar sesión
      this.session.data = proxies;
      this.session.proxiesFound = proxies.length;
      this.session.success = proxies.length > 0;
      this.session.sessionDuration = Date.now() - this.startTime;
      
      return this.session;
      
    } catch (error) {
      UserInterface.showStatus(`Error en sesión: ${error instanceof Error ? error.message : String(error)}`, 'error');
      this.session.errors.push(error instanceof Error ? error.message : String(error));
      this.session.sessionDuration = Date.now() - this.startTime;
      return this.session;
    } finally {
      await this.cleanup();
    }
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      // Mantener browser abierto por 5 segundos para que el usuario vea el resultado
      UserInterface.showStatus('Cerrando navegador en 5 segundos...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await this.browser.close();
    }
  }
}

// Función principal para ejecutar el MVP
async function runHybridMVP(): Promise<void> {
  const scraper = new HybridScraper();
  const session = await scraper.runHybridSession();
  
  // Guardar resultados
  writeFileSync('results/hybrid-session.json', JSON.stringify(session, null, 2));
  
  // Mostrar resultados
  UserInterface.showResults(session);
  UserInterface.showConclusion(session);
  
  console.log('\n💾 Resultados guardados en results/hybrid-session.json');
}

// Ejecutar si es el archivo principal
runHybridMVP().catch(console.error); 