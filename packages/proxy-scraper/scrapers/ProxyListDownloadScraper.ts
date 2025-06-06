import { ProxyScraper } from '../core/ProxyScraper.js';
import type { 
  ProxyData, 
  ScrapingResult 
} from '../types/proxy.types.js';

/**
 * Scraper específico para Proxy List Download
 * URL: https://www.proxy-list.download/HTTPS
 */
export class ProxyListDownloadScraper extends ProxyScraper {
  private readonly targetUrl = 'https://www.proxy-list.download/HTTPS';
  private readonly siteName = 'Proxy List Download';

  /**
   * Implementación específica del scraping para Proxy List Download
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
      this.log('info', 'Esperando que se cargue la tabla de proxies...');
      
      try {
        await this.page.waitForSelector('table', { timeout: 15000 });
        this.log('info', 'Tabla encontrada, extrayendo datos...');
      } catch (error) {
        this.log('warn', 'No se encontró tabla con selector estándar, probando alternativas...');
        
        // Intentar selectores alternativos
        const alternativeSelectors = [
          'tbody tr',
          '.proxy-table',
          '[data-label="IP Address"]',
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
          throw new Error('No se pudo localizar la tabla de proxies');
        }
      }

      // Extraer datos de la tabla
      const extractedProxies = await this.extractProxyDataFromTable();
      proxies.push(...extractedProxies);

      this.log('info', `Extracción completada: ${proxies.length} proxies encontrados`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error durante el scraping: ${errorMessage}`);
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

    this.log('info', `Scraping finalizado`, {
      proxiesFound: proxies.length,
      executionTime,
      errors: errors.length
    });

    return result;
  }

  /**
   * Extraer datos de proxy de la tabla HTML
   */
  private async extractProxyDataFromTable(): Promise<ProxyData[]> {
    if (!this.page) {
      throw new Error('Página no disponible');
    }

    this.log('debug', 'Extrayendo datos de la tabla...');

    try {
      // Evaluar JavaScript en la página para extraer datos
      const proxies = await this.page.evaluate(() => {
        const results: Array<{
          ip: string;
          port: number;
          country?: string;
          anonymity?: string;
          speed?: number;
        }> = [];

        // Buscar todas las tablas posibles
        const tables = document.querySelectorAll('table, .proxy-table');
        
        for (const table of tables) {
          // Buscar filas que contengan datos de proxy
          const rows = table.querySelectorAll('tr, tbody tr');
          
          for (const row of rows) {
            const cells = row.querySelectorAll('td, th');
            
            if (cells.length >= 2) {
              const firstCell = cells[0]?.textContent?.trim() || '';
              const secondCell = cells[1]?.textContent?.trim() || '';
              
              // Verificar si parece una dirección IP:Puerto
              const ipPortPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)$/;
              const ipPortMatch = firstCell.match(ipPortPattern);
              
              if (ipPortMatch) {
                const [, ip, portStr] = ipPortMatch;
                const port = parseInt(portStr, 10);
                
                if (port > 0 && port <= 65535) {
                  const proxy: any = {
                    ip,
                    port
                  };

                  // Intentar extraer país si está disponible
                  if (cells.length > 2) {
                    const countryCell = cells[2]?.textContent?.trim();
                    if (countryCell && countryCell.length > 0) {
                      proxy.country = countryCell;
                    }
                  }

                  // Intentar extraer nivel de anonimato
                  if (cells.length > 3) {
                    const anonymityCell = cells[3]?.textContent?.trim()?.toLowerCase();
                    if (anonymityCell) {
                      if (anonymityCell.includes('elite') || anonymityCell.includes('high')) {
                        proxy.anonymity = 'elite';
                      } else if (anonymityCell.includes('anonymous')) {
                        proxy.anonymity = 'anonymous';
                      } else if (anonymityCell.includes('transparent')) {
                        proxy.anonymity = 'transparent';
                      }
                    }
                  }

                  // Intentar extraer velocidad si está disponible
                  if (cells.length > 4) {
                    const speedCell = cells[4]?.textContent?.trim();
                    if (speedCell) {
                      const speedMatch = speedCell.match(/(\d+)/);
                      if (speedMatch) {
                        proxy.speed = parseInt(speedMatch[1], 10);
                      }
                    }
                  }

                  results.push(proxy);
                }
              } else {
                // Buscar IP y puerto en celdas separadas
                const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
                const portPattern = /^\d+$/;
                
                if (ipPattern.test(firstCell) && portPattern.test(secondCell)) {
                  const port = parseInt(secondCell, 10);
                  
                  if (port > 0 && port <= 65535) {
                    const proxy: any = {
                      ip: firstCell,
                      port
                    };

                    // Extraer información adicional de celdas posteriores
                    if (cells.length > 2) {
                      const countryCell = cells[2]?.textContent?.trim();
                      if (countryCell && countryCell.length > 0) {
                        proxy.country = countryCell;
                      }
                    }

                    results.push(proxy);
                  }
                }
              }
            }
          }
        }

        // También buscar texto simple que contenga IP:Puerto
        const textContent = document.body.textContent || '';
        const ipPortMatches = textContent.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/g);
        
        if (ipPortMatches) {
          for (const match of ipPortMatches) {
            const [ip, portStr] = match.split(':');
            const port = parseInt(portStr, 10);
            
            if (port > 0 && port <= 65535) {
              // Evitar duplicados
              const exists = results.some(p => p.ip === ip && p.port === port);
              if (!exists) {
                results.push({ ip, port });
              }
            }
          }
        }

        return results;
      });

      this.log('debug', `JavaScript evaluation completada: ${proxies.length} proxies extraídos`);

             // Convertir a formato ProxyData
      const proxyData: ProxyData[] = proxies.map(proxy => ({
        ip: proxy.ip,
        port: proxy.port,
        protocol: 'https' as const, // Asumimos HTTPS ya que es la lista HTTPS
        ...(proxy.country && { country: proxy.country }),
        ...(proxy.anonymity && { anonymity: proxy.anonymity as 'transparent' | 'anonymous' | 'elite' }),
        ...(proxy.speed && { speed: proxy.speed }),
        lastChecked: new Date(),
        source: this.targetUrl,
        metadata: {
          scrapedAt: new Date().toISOString(),
          scraper: this.siteName
        }
      }));

      this.log('info', `Conversión completada: ${proxyData.length} proxies procesados`);

      return proxyData;

    } catch (error) {
      this.log('error', `Error extrayendo datos de la tabla: ${error}`);
      throw error;
    }
  }

  /**
   * Validar que un proxy tenga formato válido
   */
  private isValidProxy(ip: string, port: number): boolean {
    // Validar IP
    const ipParts = ip.split('.');
    if (ipParts.length !== 4) return false;
    
    for (const part of ipParts) {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0 || num > 255) return false;
    }

    // Validar puerto
    return port > 0 && port <= 65535;
  }
} 