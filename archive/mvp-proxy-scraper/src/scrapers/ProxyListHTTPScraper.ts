import { ProxyScraper } from '../core/ProxyScraper.js';
import type { 
  ProxyData, 
  ScrapingResult 
} from '../types/proxy.types.js';

/**
 * Scraper específico para Proxy List Download - HTTP
 * URL: https://www.proxy-list.download/HTTP
 */
export class ProxyListHTTPScraper extends ProxyScraper {
  private readonly targetUrl = 'https://www.proxy-list.download/HTTP';
  private readonly siteName = 'Proxy List Download HTTP';

  /**
   * Implementación específica del scraping para la lista HTTP
   */
  public async scrapeProxies(): Promise<ScrapingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const proxies: ProxyData[] = [];

    this.log('info', `Iniciando scraping de ${this.siteName}`);

    try {
      // Navegar al sitio con manejo de Cloudflare
      await this.navigateWithCloudflareHandling(this.targetUrl);

      if (!this.page) {
        throw new Error('Página no disponible');
      }

      // Esperar a que la tabla se cargue
      this.log('info', 'Esperando que se cargue la tabla de proxies HTTP...');
      
      try {
        await this.page.waitForSelector('table', { timeout: 15000 });
        this.log('info', 'Tabla encontrada, extrayendo datos HTTP...');
      } catch (error) {
        this.log('warn', 'No se encontró tabla con selector estándar, probando alternativas...');
        
        // Intentar selectores alternativos específicos para la página HTTP
        const alternativeSelectors = [
          'tbody tr',
          '.table tbody tr',
          'tr:has(td)',
          'td'
        ];

        let tableFound = false;
        for (const selector of alternativeSelectors) {
          try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
            this.log('info', `Tabla encontrada con selector: ${selector}`);
            tableFound = true;
            break;
          } catch {
            continue;
          }
        }

        if (!tableFound) {
          throw new Error('No se pudo localizar la tabla de proxies HTTP');
        }
      }

      // Extraer datos de la tabla con lógica específica para HTTP
      const extractedProxies = await this.extractHTTPProxyDataFromTable();
      proxies.push(...extractedProxies);

      this.log('info', `Extracción HTTP completada: ${proxies.length} proxies encontrados`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error durante el scraping HTTP: ${errorMessage}`);
      errors.push(errorMessage);
    }

    const executionTime = Date.now() - startTime;

    const result: ScrapingResult = {
      success: proxies.length > 0,
      proxies,
      totalFound: proxies.length,
      errors,
      timestamp: new Date(),
      executionTime,
      source: {
        name: this.siteName,
        url: this.targetUrl,
        scrapedAt: new Date()
      }
    };

    this.log('info', `Scraping HTTP finalizado`, {
      proxiesFound: proxies.length,
      executionTime,
      errors: errors.length
    });

    return result;
  }

  /**
   * Extraer datos de proxy HTTP de la tabla con estructura mejorada
   */
  private async extractHTTPProxyDataFromTable(): Promise<ProxyData[]> {
    if (!this.page) {
      throw new Error('Página no disponible');
    }

    this.log('debug', 'Extrayendo datos de la tabla HTTP...');

    try {
      // Evaluar JavaScript en la página para extraer datos HTTP específicos
      const proxies = await this.page.evaluate(() => {
        const results: Array<{
          ip: string;
          port: number;
          country?: string;
          countryCode?: string;
          anonymity?: string;
          speed?: number;
        }> = [];

        // Buscar la tabla principal de proxies
        const table = document.querySelector('table');
        
        if (table) {
          // Buscar todas las filas de datos (excluyendo header)
          const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
          
          for (const row of rows) {
            const cells = row.querySelectorAll('td');
            
            // Estructura esperada: IP Address | Port | Anonymity | Country | Speed
            if (cells.length >= 4) {
              const ipCell = cells[0]?.textContent?.trim() || '';
              const portCell = cells[1]?.textContent?.trim() || '';
              const anonymityCell = cells[2]?.textContent?.trim() || '';
              const countryCell = cells[3]?.textContent?.trim() || '';
              const speedCell = cells[4]?.textContent?.trim() || '';
              
              // Validar IP
              const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
              if (ipPattern.test(ipCell)) {
                const port = parseInt(portCell, 10);
                
                if (port > 0 && port <= 65535) {
                  const proxy: any = {
                    ip: ipCell,
                    port
                  };

                  // Extraer anonimato
                  if (anonymityCell && anonymityCell.length > 0) {
                    const anonLower = anonymityCell.toLowerCase();
                    if (anonLower.includes('elite')) {
                      proxy.anonymity = 'elite';
                    } else if (anonLower.includes('anonymous')) {
                      proxy.anonymity = 'anonymous';
                    } else if (anonLower.includes('transparent')) {
                      proxy.anonymity = 'transparent';
                    }
                  }

                  // Extraer país
                  if (countryCell && countryCell.length > 0) {
                    // Limpiar el nombre del país de enlaces y símbolos
                    const countryName = countryCell.replace(/[\[\]]/g, '').trim();
                    if (countryName && countryName.length > 0) {
                      proxy.country = countryName;
                      
                      // Intentar extraer código de país del atributo href o contenido
                      const countryLink = cells[3]?.querySelector('a');
                      if (countryLink) {
                        const href = countryLink.getAttribute('href');
                        if (href) {
                          const codeMatch = href.match(/country=([A-Z]{2})/);
                          if (codeMatch && codeMatch[1]) {
                            proxy.countryCode = codeMatch[1];
                          }
                        }
                      }
                    }
                  }

                  // Extraer velocidad
                  if (speedCell) {
                    const speedMatch = speedCell.match(/(\d+)\s*ms/);
                    if (speedMatch) {
                      proxy.speed = parseInt(speedMatch[1], 10);
                    }
                  }

                  results.push(proxy);
                }
              }
            }
          }
        }

        // También buscar en el texto de la página patrones IP:Puerto como fallback
        const textContent = document.body.textContent || '';
        const ipPortMatches = textContent.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\s+\d+/g);
        
        if (ipPortMatches) {
          for (const match of ipPortMatches) {
            const parts = match.trim().split(/\s+/);
            if (parts.length >= 2) {
              const ip = parts[0];
              const port = parseInt(parts[1], 10);
              
              if (port > 0 && port <= 65535) {
                // Evitar duplicados
                const exists = results.some(p => p.ip === ip && p.port === port);
                if (!exists) {
                  results.push({ ip, port });
                }
              }
            }
          }
        }

        return results;
      });

      this.log('debug', `JavaScript evaluation HTTP completada: ${proxies.length} proxies extraídos`);

      // Convertir a formato ProxyData
      const proxyData: ProxyData[] = proxies.map(proxy => ({
        ip: proxy.ip,
        port: proxy.port,
        protocol: 'http' as const, // Lista HTTP
        ...(proxy.country && { country: proxy.country }),
        ...(proxy.countryCode && { countryCode: proxy.countryCode }),
        ...(proxy.anonymity && { anonymity: proxy.anonymity as 'transparent' | 'anonymous' | 'elite' }),
        ...(proxy.speed && { speed: proxy.speed }),
        lastChecked: new Date(),
        source: this.targetUrl,
        metadata: {
          scrapedAt: new Date().toISOString(),
          scraper: this.siteName,
          protocol: 'http'
        }
      }));

      this.log('info', `Conversión HTTP completada: ${proxyData.length} proxies procesados`);

      return proxyData;

    } catch (error) {
      this.log('error', `Error extrayendo datos de la tabla HTTP: ${error}`);
      throw error;
    }
  }

  /**
   * Validar formato de proxy específico para HTTP
   */
  private isValidHTTPProxy(ip: string, port: number): boolean {
    // Validar IP
    const ipParts = ip.split('.');
    if (ipParts.length !== 4) return false;
    
    for (const part of ipParts) {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0 || num > 255) return false;
    }

    // Validar puerto (HTTP comúnmente usa 80, 8080, 3128, etc.)
    return port > 0 && port <= 65535;
  }
} 