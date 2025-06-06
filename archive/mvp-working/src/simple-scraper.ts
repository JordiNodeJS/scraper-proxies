// Scraper simplificado para demostrar funcionamiento inmediato
import { load } from 'cheerio';

interface SimpleProxy {
  ip: string;
  port: number;
  protocol: string;
  country?: string;
  anonymity?: string;
}

export class SimpleScraper {
  
  static async scrapeProxyListDownload(url: string): Promise<SimpleProxy[]> {
    console.log(`🔍 Scrapeando ${url}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = load(html);
      const proxies: SimpleProxy[] = [];

      // Buscar en todas las tablas
      $('table tbody tr').each((index, element) => {
        const cells = $(element).find('td');
        if (cells.length >= 2) {
          const ip = $(cells[0]).text().trim();
          const portText = $(cells[1]).text().trim();
          const port = parseInt(portText);
          
          // Validación básica
          if (this.isValidIP(ip) && !isNaN(port) && port > 0 && port <= 65535) {
            const country = cells.length > 3 ? $(cells[3]).text().trim() : 'Unknown';
            const anonymity = cells.length > 2 ? $(cells[2]).text().trim() : 'Unknown';
            
            proxies.push({
              ip,
              port,
              protocol: url.includes('HTTPS') ? 'HTTPS' : 'HTTP',
              country: country || 'Unknown',
              anonymity: anonymity || 'Unknown'
            });
          }
        }
      });

      console.log(`✅ ${proxies.length} proxies encontrados en ${url}`);
      return proxies;

    } catch (error) {
      console.error(`❌ Error en ${url}:`, error);
      return [];
    }
  }

  static async scrapeProxyScrapeAPI(url: string): Promise<SimpleProxy[]> {
    console.log(`🔍 Scrapeando API ${url}...`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      const lines = text.trim().split('\n');
      const proxies: SimpleProxy[] = [];

             for (const line of lines) {
         const trimmed = line.trim();
         if (trimmed && trimmed.includes(':')) {
           const parts = trimmed.split(':');
           const ip = parts[0];
           const portStr = parts[1];
           const port = parseInt(portStr || '0');
           
           if (ip && this.isValidIP(ip) && !isNaN(port)) {
            proxies.push({
              ip: ip.trim(),
              port,
              protocol: 'HTTP'
            });
          }
        }
      }

      console.log(`✅ ${proxies.length} proxies encontrados en API`);
      return proxies;

    } catch (error) {
      console.error(`❌ Error en API:`, error);
      return [];
    }
  }

  static async scrapeAll(): Promise<SimpleProxy[]> {
    console.log('🚀 INICIANDO SCRAPING SIMPLE');
    console.log('============================\n');

    const sources = [
      'https://www.proxy-list.download/HTTP',
      'https://www.proxy-list.download/HTTPS',
      'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all'
    ];

    const allProxies: SimpleProxy[] = [];

    for (const source of sources) {
      let proxies: SimpleProxy[] = [];
      
      if (source.includes('api.proxyscrape.com')) {
        proxies = await this.scrapeProxyScrapeAPI(source);
      } else {
        proxies = await this.scrapeProxyListDownload(source);
      }
      
      allProxies.push(...proxies);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Remover duplicados
    const unique = this.removeDuplicates(allProxies);
    
    console.log('\n🏆 RESUMEN FINAL:');
    console.log(`📊 Total proxies únicos: ${unique.length}`);
    
    // Estadísticas por protocolo
    const byProtocol = this.groupBy(unique, 'protocol');
    Object.entries(byProtocol).forEach(([protocol, proxies]) => {
      console.log(`   ${protocol}: ${proxies.length}`);
    });

    // Mostrar algunos ejemplos
    console.log('\n🔗 Ejemplos encontrados:');
    unique.slice(0, 10).forEach((proxy, i) => {
      console.log(`   ${i + 1}. ${proxy.ip}:${proxy.port} (${proxy.protocol})`);
    });

    // Guardar resultados
    this.saveResults(unique);

    return unique;
  }

  private static isValidIP(ip: string): boolean {
    const regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!regex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  }

  private static removeDuplicates(proxies: SimpleProxy[]): SimpleProxy[] {
    const seen = new Set<string>();
    return proxies.filter(proxy => {
      const key = `${proxy.ip}:${proxy.port}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private static saveResults(proxies: SimpleProxy[]): void {
    const fs = require('fs');
    
    try {
      fs.mkdirSync('results', { recursive: true });
    } catch (error) {
      // Ya existe
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    
    // JSON completo
    const jsonData = {
      proxies,
      totalCount: proxies.length,
      generatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(`results/proxies-${timestamp}.json`, JSON.stringify(jsonData, null, 2));
    
    // Lista simple
    const simpleList = proxies.map(p => `${p.ip}:${p.port}`).join('\n');
    fs.writeFileSync(`results/proxies-${timestamp}.txt`, simpleList);
    
    console.log(`\n💾 Resultados guardados:`);
    console.log(`   📄 results/proxies-${timestamp}.json`);
    console.log(`   📝 results/proxies-${timestamp}.txt`);
  }
} 