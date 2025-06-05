import { chromium, Browser, Page } from '@playwright/test';
import { writeFileSync } from 'fs';
import { ProxyData, ScrapingResult } from './types.js';

export class FreeproxyWorldScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    console.log('🚀 Inicializando browser...');
    
    this.browser = await chromium.launch({
      headless: false,
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

    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    this.page = await context.newPage();
  }

  async scrapeProxies(maxPages: number = 3): Promise<ScrapingResult> {
    if (!this.page) {
      throw new Error('Browser no inicializado. Llama a initialize() primero.');
    }

    const allProxies: ProxyData[] = [];
    const baseUrl = 'https://www.freeproxy.world/?type=https&anonymity=&country=&speed=500&port=&page=';

    console.log(`📡 Iniciando scraping de ${maxPages} páginas...`);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        console.log(`\n🌐 Scrapeando página ${pageNum}...`);
        
        const url = `${baseUrl}${pageNum}`;
        await this.page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // Esperar a que la tabla se cargue
        await this.page.waitForSelector('table.layui-table', { timeout: 10000 });
        await this.page.waitForTimeout(3000); // Dar más tiempo para cargar datos

        // Extraer proxies de la página actual
        const pageProxies = await this.extractProxiesFromPage();
        console.log(`✅ Encontrados ${pageProxies.length} proxies en página ${pageNum}`);
        
        allProxies.push(...pageProxies);

        // Pausa entre páginas para evitar rate limiting
        if (pageNum < maxPages) {
          console.log('⏳ Esperando antes de la siguiente página...');
          await this.page.waitForTimeout(3000);
        }

      } catch (error) {
        console.error(`❌ Error en página ${pageNum}:`, error);
        continue;
      }
    }

    const result: ScrapingResult = {
      success: allProxies.length > 0,
      proxies: allProxies,
      totalFound: allProxies.length,
      source: 'freeproxy.world',
      timestamp: new Date()
    };

    // Guardar resultados
    this.saveResults(result);
    
    return result;
  }

  private async extractProxiesFromPage(): Promise<ProxyData[]> {
    if (!this.page) throw new Error('Page no disponible');

    const proxies: ProxyData[] = [];

    // Obtener todas las filas de la tabla (excluyendo header y filas vacías)
    const rows = await this.page.locator('table.layui-table tbody tr').all();

    for (const row of rows) {
      try {
        // Verificar si la fila tiene contenido (no es una fila vacía de separación)
        const cellCount = await row.locator('td').count();
        if (cellCount < 8) continue; // Necesitamos 8 columnas mínimo
        
        // Verificar que la fila tenga texto (no esté vacía)
        const rowText = await row.textContent();
        if (!rowText || rowText.trim().length < 10) continue;

        // Extraer datos de cada celda
        const cells = await row.locator('td').all();
        
        const ipText = await cells[0].textContent();
        const portText = await cells[1].textContent();
        const countryText = await cells[2].textContent();
        const cityText = await cells[3].textContent();
        const speedText = await cells[4].textContent();
        const typeText = await cells[5].textContent();
        const anonymityText = await cells[6].textContent();
        const lastCheckText = await cells[7]?.textContent();

        // Limpiar y validar datos
        const ip = ipText?.trim() || '';
        const portMatch = portText?.match(/\d+/);
        const port = portMatch ? parseInt(portMatch[0]) : 0;
        
        // Extraer país (remover flag y espacios extra)
        const country = countryText?.replace(/\s+/g, ' ').trim() || '';
        
        // Extraer velocidad en ms
        const speedMatch = speedText?.match(/(\d+)\s*ms/);
        const speed = speedMatch ? parseInt(speedMatch[1]) : 0;
        
        // Extraer tipo de proxy
        const protocol = typeText?.toLowerCase().includes('https') ? 'HTTPS' : 'HTTP';
        
        // Extraer nivel de anonimato
        const anonymity = anonymityText?.trim() || '';
        
        // Validar que tenemos datos mínimos necesarios
        if (ip && port > 0 && this.isValidIP(ip)) {
          const proxy: ProxyData = {
            ip,
            port,
            country,
            anonymity,
            speed,
            uptime: '', // No disponible en esta fuente
            lastCheck: lastCheckText?.trim() || '',
            protocol: protocol as 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5'
          };

          proxies.push(proxy);
        }

      } catch (error) {
        console.warn('⚠️ Error procesando fila:', error);
        continue;
      }
    }

    return proxies;
  }

  private isValidIP(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  private saveResults(result: ScrapingResult): void {
    console.log('\n💾 Guardando resultados...');
    
    // Guardar JSON completo
    const jsonPath = `freeproxy-world-${Date.now()}.json`;
    writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    console.log(`📄 JSON guardado: ${jsonPath}`);

    // Guardar lista simple de proxies
    const proxyList = result.proxies.map(p => `${p.ip}:${p.port}`).join('\n');
    const txtPath = `freeproxy-world-${Date.now()}.txt`;
    writeFileSync(txtPath, proxyList);
    console.log(`📄 TXT guardado: ${txtPath}`);

    // Mostrar estadísticas
    console.log(`\n📊 ESTADÍSTICAS:`);
    console.log(`   Total proxies: ${result.totalFound}`);
    console.log(`   Fuente: ${result.source}`);
    console.log(`   Fecha: ${result.timestamp.toLocaleString()}`);
    
    // Agrupar por país
    const byCountry = result.proxies.reduce((acc, proxy) => {
      acc[proxy.country] = (acc[proxy.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`\n🌍 Por países (top 5):`);
    Object.entries(byCountry)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([country, count]) => {
        console.log(`   ${country}: ${count}`);
      });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser cerrado');
    }
  }
} 