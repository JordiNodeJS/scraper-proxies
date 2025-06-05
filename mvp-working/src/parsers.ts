import { load } from 'cheerio';
import type { ProxyData } from './types.ts';

export class ProxyParsers {
  
  // Parser para proxy-list.download (tu fuente principal)
  static proxyListDownload(html: string, protocol: ProxyData['protocol'], source: string): ProxyData[] {
    const $ = load(html);
    const proxies: ProxyData[] = [];
    
    $('table tbody tr, table tr').each((_, element: any) => {
      const cells = $(element).find('td');
      if (cells.length >= 5) {
        const ip = $(cells[0]).text().trim();
        const portText = $(cells[1]).text().trim();
        const port = parseInt(portText);
        const anonymityText = $(cells[2]).text().trim();
        const country = $(cells[3]).text().trim();
        const speedText = $(cells[4]).text().trim();
        
        // Extraer velocidad en ms
        const speedMatch = speedText.match(/(\d+)/);
        const speed = speedMatch ? parseInt(speedMatch[1]) : 999;
        
        // Normalizar anonymity
        const anonymity = ProxyParsers.normalizeAnonymity(anonymityText);
        
        // Código de país simple basado en nombre
        const countryCode = ProxyParsers.getCountryCode(country);
        
        if (ip && !isNaN(port) && ProxyParsers.isValidIP(ip) && ProxyParsers.isValidPort(port)) {
          proxies.push({
            ip,
            port,
            protocol,
            anonymity,
            country: country || 'Unknown',
            countryCode,
            speed,
            lastChecked: new Date(),
            source
          });
        }
      }
    });
    
    return proxies;
  }

  // Parser para freeproxylist.net y sslproxies.org
  static freeProxyList(html: string, protocol: ProxyData['protocol'], source: string): ProxyData[] {
    const $ = load(html);
    const proxies: ProxyData[] = [];
    
    $('#proxylisttable tbody tr, .table tbody tr').each((_, element: any) => {
      const cells = $(element).find('td');
      if (cells.length >= 8) {
        const ip = $(cells[0]).text().trim();
        const portText = $(cells[1]).text().trim();
        const port = parseInt(portText);
        const countryCode = $(cells[2]).text().trim();
        const country = $(cells[3]).text().trim();
        const anonymityText = $(cells[4]).text().trim();
        const isGoogle = $(cells[5]).text().trim() === 'yes';
        const isHttps = $(cells[6]).text().trim() === 'yes';
        
        // Determinar protocolo basado en HTTPS column
        const finalProtocol = isHttps ? 'HTTPS' : protocol;
        
        if (ip && !isNaN(port) && ProxyParsers.isValidIP(ip) && ProxyParsers.isValidPort(port)) {
          proxies.push({
            ip,
            port,
            protocol: finalProtocol,
            anonymity: ProxyParsers.normalizeAnonymity(anonymityText),
            country: country || 'Unknown',
            countryCode: countryCode || 'UN',
            speed: 200,
            lastChecked: new Date(),
            source,
            uptime: isGoogle ? 90 : 70
          });
        }
      }
    });
    
    return proxies;
  }

  // Parser para GeoNode API (JSON)
  static geoNodeAPI(jsonText: string, protocol: ProxyData['protocol'], source: string): ProxyData[] {
    try {
      const data = JSON.parse(jsonText);
      const proxies: ProxyData[] = [];
      
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((item: any) => {
          if (item.ip && item.port) {
            proxies.push({
              ip: item.ip,
              port: parseInt(item.port),
              protocol: item.protocols?.[0]?.toUpperCase() || protocol,
              anonymity: ProxyParsers.normalizeAnonymity(item.anonymityLevel || 'transparent'),
              country: item.country || 'Unknown',
              countryCode: item.iso_code || 'UN',
              speed: item.responseTime || 300,
              uptime: item.upTime || 50,
              lastChecked: new Date(item.lastChecked || Date.now()),
              source
            });
          }
        });
      }
      
      return proxies;
    } catch (error) {
      console.error('Error parsing GeoNode API:', error);
      return [];
    }
  }

  // Parser para ProxyScrape API (texto plano)
  static proxyScrapeAPI(text: string, protocol: ProxyData['protocol'], source: string): ProxyData[] {
    const proxies: ProxyData[] = [];
    const lines = text.trim().split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(':')) {
        const [ip, portStr] = trimmed.split(':');
        const port = parseInt(portStr || '0');
        
        if (ip && ProxyParsers.isValidIP(ip) && ProxyParsers.isValidPort(port)) {
          proxies.push({
            ip: ip.trim(),
            port,
            protocol,
            anonymity: 'Transparent',
            country: 'Unknown',
            countryCode: 'UN',
            speed: 250,
            lastChecked: new Date(),
            source
          });
        }
      }
    });
    
    return proxies;
  }

  // Parser para Spys.one (HTML complejo)
  static spysOne(html: string, protocol: ProxyData['protocol'], source: string): ProxyData[] {
    const $ = load(html);
    const proxies: ProxyData[] = [];
    
    $('table tr').each((_, element: any) => {
      const cells = $(element).find('td');
      if (cells.length >= 6) {
        const ipPortText = $(cells[0]).text().trim();
        const countryText = $(cells[1]).text().trim();
        const anonymityText = $(cells[2]).text().trim();
        
        // Extraer IP:Puerto
        const ipPortMatch = ipPortText.match(/(\d+\.\d+\.\d+\.\d+):(\d+)/);
        if (ipPortMatch) {
          const ip = ipPortMatch[1];
          const port = parseInt(ipPortMatch[2]);
          
          if (ProxyParsers.isValidIP(ip) && ProxyParsers.isValidPort(port)) {
            proxies.push({
              ip,
              port,
              protocol,
              anonymity: ProxyParsers.normalizeAnonymity(anonymityText),
              country: countryText || 'Unknown',
              countryCode: 'UN',
              speed: 300,
              lastChecked: new Date(),
              source
            });
          }
        }
      }
    });
    
    return proxies;
  }

  // Parser para ProxyNova
  static proxyNova(html: string, protocol: ProxyData['protocol'], source: string): ProxyData[] {
    const $ = load(html);
    const proxies: ProxyData[] = [];
    
    $('table tbody tr').each((_, element: any) => {
      const cells = $(element).find('td');
      if (cells.length >= 7) {
        const ip = $(cells[0]).text().trim();
        const portText = $(cells[1]).text().trim();
        const port = parseInt(portText);
        const country = $(cells[5]).text().trim();
        const anonymityText = $(cells[4]).text().trim();
        const speedText = $(cells[2]).text().trim();
        
        // Extraer velocidad numérica
        const speedMatch = speedText.match(/(\d+)/);
        const numSpeed = speedMatch ? parseInt(speedMatch[1]) : 300;
        
        if (ip && !isNaN(port) && ProxyParsers.isValidIP(ip) && ProxyParsers.isValidPort(port)) {
          proxies.push({
            ip,
            port,
            protocol,
            anonymity: ProxyParsers.normalizeAnonymity(anonymityText),
            country: country || 'Unknown',
            countryCode: 'UN',
            speed: numSpeed,
            lastChecked: new Date(),
            source
          });
        }
      }
    });
    
    return proxies;
  }

  // Parser para GitHub raw (texto plano)
  static githubRaw(text: string, protocol: ProxyData['protocol'], source: string): ProxyData[] {
    const proxies: ProxyData[] = [];
    const lines = text.trim().split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(':') && !trimmed.startsWith('#')) {
        const [ip, portStr] = trimmed.split(':');
        const port = parseInt(portStr || '0');
        
        if (ip && ProxyParsers.isValidIP(ip) && ProxyParsers.isValidPort(port)) {
          proxies.push({
            ip: ip.trim(),
            port,
            protocol,
            anonymity: 'Transparent',
            country: 'Unknown',
            countryCode: 'UN',
            speed: 400,
            lastChecked: new Date(),
            source
          });
        }
      }
    });
    
    return proxies;
  }

  // Parser para ProxyListPlus
  static proxyListPlus(html: string, protocol: ProxyData['protocol'], source: string): ProxyData[] {
    const $ = load(html);
    const proxies: ProxyData[] = [];
    
    $('table tr').each((_, element: any) => {
      const cells = $(element).find('td');
      if (cells.length >= 4) {
        const ip = $(cells[0]).text().trim();
        const portText = $(cells[1]).text().trim();
        const port = parseInt(portText);
        const country = $(cells[2]).text().trim();
        const anonymityText = $(cells[3]).text().trim();
        
        if (ip && !isNaN(port) && ProxyParsers.isValidIP(ip) && ProxyParsers.isValidPort(port)) {
          proxies.push({
            ip,
            port,
            protocol,
            anonymity: ProxyParsers.normalizeAnonymity(anonymityText),
            country: country || 'Unknown',
            countryCode: 'UN',
            speed: 350,
            lastChecked: new Date(),
            source
          });
        }
      }
    });
    
    return proxies;
  }

  // Validaciones utilitarias
  private static isValidIP(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  private static isValidPort(port: number): boolean {
    return port > 0 && port <= 65535;
  }

  private static normalizeAnonymity(anonymity: string): ProxyData['anonymity'] {
    const lower = anonymity.toLowerCase();
    if (lower.includes('elite') || lower.includes('high')) return 'Elite';
    if (lower.includes('anonymous') || lower.includes('anon')) return 'Anonymous';
    return 'Transparent';
  }

  private static getCountryCode(country: string): string {
    const countryMap: Record<string, string> = {
      'United States': 'US',
      'China': 'CN',
      'India': 'IN',
      'Indonesia': 'ID',
      'Iran': 'IR',
      'Vietnam': 'VN',
      'Mexico': 'MX',
      'Germany': 'DE',
      'United Kingdom': 'GB',
      'France': 'FR',
      'Brazil': 'BR',
      'Russia': 'RU',
      'Japan': 'JP',
      'Korea': 'KR',
      'Canada': 'CA',
      'Australia': 'AU'
    };
    
    return countryMap[country] || 'UN';
  }
} 