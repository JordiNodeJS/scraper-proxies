import { chromium } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import type { ProxyData, ScrapingResult } from './types.js';
import { isValidIP, isValidPort, detectProtocol, cleanText } from './utils.js';

class PlaywrightScraper {
  private browser?: Browser;
  private page?: Page;

  async initBrowser(): Promise<void> {
    console.log('🚀 Iniciando browser con evasión Cloudflare...');
    
    this.browser = await chromium.launch({
      headless: true, // Cambiar a headless para segunda prueba
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-component-extensions-with-background-pages',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-web-security'
      ]
    });

    this.page = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
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

  async testScraping(): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      success: false,
      proxiesFound: 0,
      data: [],
      errors: [],
      cloudflareBypass: false,
      pageStructure: {
        hasTable: false,
        tableRows: 0,
        paginationFound: false
      }
    };

    try {
      await this.initBrowser();
      
      console.log('🔍 Navegando a hide.mn...');
      
      // Navegar con estrategia más permisiva
      console.log('🔄 Intentando estrategia 1: networkidle...');
      
      let response;
      try {
        response = await this.page!.goto('https://hide.mn/es/proxy-list/?type=s#list', {
          waitUntil: 'networkidle',
          timeout: 15000
        });
      } catch (error1) {
        console.log('🔄 Estrategia 1 falló, intentando estrategia 2: domcontentloaded...');
        try {
          response = await this.page!.goto('https://hide.mn/es/proxy-list/?type=s#list', {
            waitUntil: 'domcontentloaded',
            timeout: 15000
          });
          // Esperar un poco más para que cargue el contenido
          await this.page!.waitForTimeout(3000);
        } catch (error2) {
          console.log('🔄 Estrategia 2 falló, intentando estrategia 3: load...');
          response = await this.page!.goto('https://hide.mn/es/proxy-list/?type=s#list', {
            waitUntil: 'load',
            timeout: 20000
          });
        }
      }

      console.log(`📊 Status: ${response?.status()}`);

      // Verificar si pasamos Cloudflare
      const title = await this.page!.title();
      const url = this.page!.url();
      
      console.log(`📄 Título: ${title}`);
      console.log(`🔗 URL final: ${url}`);

      // Detectar si estamos en página de challenge
      const isChallenge = await this.page!.evaluate(() => {
        return document.body.innerText.includes('Checking your browser') ||
               document.body.innerText.includes('Cloudflare') ||
               document.title.includes('Just a moment');
      });

      if (isChallenge) {
        console.log('⏳ Detectado challenge de Cloudflare, esperando...');
        
        // Esperar múltiples señales de que el challenge terminó
        try {
          await this.page!.waitForFunction(() => {
            return !document.body.innerText.includes('Checking your browser') &&
                   !document.body.innerText.includes('Just a moment') &&
                   !document.title.includes('Just a moment');
          }, { timeout: 30000 });
          
          console.log('✅ Challenge superado!');
          
          // Esperar un poco más para que cargue el contenido real
          await this.page!.waitForTimeout(3000);
          
        } catch (challengeError) {
          console.log('⚠️ Challenge no completado automáticamente, intentando continuar...');
          console.log('ℹ️ Es posible que requiera interacción manual');
          
          // Esperar tiempo adicional por si acaso
          await this.page!.waitForTimeout(10000);
        }
      }

      result.cloudflareBypass = !isChallenge;

      // Obtener HTML después del challenge
      const html = await this.page!.content();
      
      console.log(`📄 HTML obtenido: ${html.length} caracteres`);

      // Analizar contenido con Cheerio
      const $ = cheerio.load(html);
      
      // Analizar estructura de página
      this.analyzePageStructure($, result);
      
      // Detectar estructura
      const tables = $('table');
      console.log(`📋 Tablas encontradas: ${tables.length}`);

      if (tables.length > 0) {
        const proxies = this.extractProxies($);
        result.data = proxies;
        result.proxiesFound = proxies.length;
        result.success = proxies.length > 0;
        
        console.log(`🎯 Proxies extraídos: ${proxies.length}`);
      }

      // Guardar HTML para análisis
      writeFileSync('results/page-content.html', html);
      
      return result;

    } catch (error) {
      console.error('❌ Error:', error);
      result.errors.push(error instanceof Error ? error.message : String(error));
      return result;
    } finally {
      await this.cleanup();
    }
  }

  private analyzePageStructure($: cheerio.CheerioAPI, result: ScrapingResult): void {
    console.log('🔍 Analizando estructura de la página...');

    // Buscar tablas posibles
    const tables = $('table');
    console.log(`📋 Tablas encontradas: ${tables.length}`);

    if (tables.length > 0) {
      result.pageStructure.hasTable = true;
      
      // Analizar la tabla más probable
      tables.each((i, table) => {
        const $table = $(table);
        const rows = $table.find('tr');
        console.log(`📋 Tabla ${i + 1}: ${rows.length} filas`);
        
        if (rows.length > result.pageStructure.tableRows) {
          result.pageStructure.tableRows = rows.length;
        }
      });
    }

    // Buscar paginación
    const paginationSelectors = [
      '.pagination',
      '.pager', 
      '.page-numbers',
      '[class*="page"]',
      '[class*="pagination"]'
    ];

    for (const selector of paginationSelectors) {
      const paginationEl = $(selector);
      if (paginationEl.length > 0) {
        result.pageStructure.paginationFound = true;
        console.log(`📄 Paginación encontrada: ${selector}`);
        
        // Intentar extraer número total de páginas
        const pageNumbers = paginationEl.find('a, span').map((_, el) => {
          const text = $(el).text().trim();
          return parseInt(text);
        }).get().filter(num => !isNaN(num));

        if (pageNumbers.length > 0) {
          result.pageStructure.totalPages = Math.max(...pageNumbers);
        }
        break;
      }
    }
  }

  private extractProxies($: cheerio.CheerioAPI): ProxyData[] {
    const proxies: ProxyData[] = [];
    
    // Múltiples selectores para tablas
    const tableSelectors = ['table tr', 'tbody tr', '.proxy-list tr'];
    
    for (const selector of tableSelectors) {
      $(selector).each((index, row) => {
        if (index === 0) return; // Skip header
        
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 2) {
          const ipText = cleanText($(cells[0]).text());
          const portText = cleanText($(cells[1]).text());
          
          if (isValidIP(ipText) && isValidPort(portText)) {
            proxies.push({
              ip: ipText,
              port: parseInt(portText),
              protocol: detectProtocol($row.text()),
              country: cells.length > 2 ? cleanText($(cells[2]).text()) : undefined
            });
          }
        }
      });
      
      if (proxies.length > 0) break;
    }
    
    return proxies;
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Ejecutar test
async function runPlaywrightMVP() {
  console.log('🚀 MVP con Playwright - Evasión Cloudflare\n');
  
  const scraper = new PlaywrightScraper();
  const result = await scraper.testScraping();

  console.log('\n📊 RESULTADOS DEL MVP PLAYWRIGHT:');
  console.log('====================================');
  console.log(`✅ Éxito: ${result.success ? 'SÍ' : 'NO'}`);
  console.log(`🛡️ Cloudflare evadido: ${result.cloudflareBypass ? 'SÍ' : 'NO'}`);
  console.log(`📋 Proxies encontrados: ${result.proxiesFound}`);
  console.log(`🏗️ Estructura encontrada:`);
  console.log(`   - Tabla: ${result.pageStructure.hasTable ? 'SÍ' : 'NO'}`);
  console.log(`   - Filas: ${result.pageStructure.tableRows}`);
  console.log(`   - Paginación: ${result.pageStructure.paginationFound ? 'SÍ' : 'NO'}`);
  if (result.pageStructure.totalPages) {
    console.log(`   - Páginas totales: ${result.pageStructure.totalPages}`);
  }

  if (result.errors.length > 0) {
    console.log(`❌ Errores: ${result.errors.length}`);
    result.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (result.data.length > 0) {
    console.log('\n🔍 MUESTRA DE DATOS:');
    console.log('=====================');
    result.data.slice(0, 5).forEach((proxy, i) => {
      console.log(`${i + 1}. ${proxy.ip}:${proxy.port} (${proxy.protocol})`);
      if (proxy.country) console.log(`   País: ${proxy.country}`);
    });
  }

  // Guardar resultados
  writeFileSync('results/playwright-results.json', JSON.stringify(result, null, 2));
  console.log('\n💾 Resultados guardados en results/playwright-results.json');

  console.log('\n🎯 CONCLUSIÓN:');
  console.log('==============');
  if (result.success) {
    console.log('✅ ÉXITO: Playwright puede evadir Cloudflare');
    console.log('✅ Proceder con desarrollo usando browser automation');
  } else if (result.cloudflareBypass) {
    console.log('🟡 PARCIAL: Cloudflare evadido pero estructura diferente');
    console.log('🟡 Revisar selectores y adaptar extracción');
  } else {
    console.log('❌ FALLIDO: Aún hay bloqueos o problemas técnicos');
    console.log('❌ Considerar fuentes alternativas');
  }
}

// Ejecutar automáticamente
runPlaywrightMVP().catch(console.error);

export { PlaywrightScraper }; 