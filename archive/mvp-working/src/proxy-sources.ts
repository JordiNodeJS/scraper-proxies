import type { ProxySource } from './types.ts';

export const PROXY_SOURCES: ProxySource[] = [
  // proxy-list.download (tus fuentes sugeridas)
  {
    name: 'Proxy List Download HTTP',
    url: 'https://www.proxy-list.download/HTTP',
    protocol: 'HTTP',
    parser: 'proxyListDownload',
    rateLimit: 2000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  },
  {
    name: 'Proxy List Download HTTPS',
    url: 'https://www.proxy-list.download/HTTPS',
    protocol: 'HTTPS',
    parser: 'proxyListDownload',
    rateLimit: 2000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  },
  {
    name: 'Proxy List Download SOCKS4',
    url: 'https://www.proxy-list.download/SOCKS4',
    protocol: 'SOCKS4',
    parser: 'proxyListDownload',
    rateLimit: 2000
  },
  {
    name: 'Proxy List Download SOCKS5',
    url: 'https://www.proxy-list.download/SOCKS5',
    protocol: 'SOCKS5',
    parser: 'proxyListDownload',
    rateLimit: 2000
  },

  // FreeProxyList.net (muy confiable, sin Cloudflare)
  {
    name: 'Free Proxy List',
    url: 'https://www.freeproxylist.net/',
    protocol: 'HTTP',
    parser: 'freeProxyList',
    rateLimit: 1500,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  },

  // FreeProxyList.net HTTPS
  {
    name: 'Free Proxy List SSL',
    url: 'https://www.sslproxies.org/',
    protocol: 'HTTPS',
    parser: 'freeProxyList',
    rateLimit: 1500
  },

  // ProxyList.geonode.com (API directa)
  {
    name: 'GeoNode Proxy API',
    url: 'https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc',
    protocol: 'HTTP',
    parser: 'geoNodeAPI',
    rateLimit: 3000,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  },

  // ProxyScrape.com (API pública)
  {
    name: 'ProxyScrape HTTP',
    url: 'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all',
    protocol: 'HTTP',
    parser: 'proxyScrapeAPI',
    rateLimit: 5000
  },
  {
    name: 'ProxyScrape SOCKS4',
    url: 'https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks4&timeout=10000&country=all',
    protocol: 'SOCKS4',
    parser: 'proxyScrapeAPI',
    rateLimit: 5000
  },
  {
    name: 'ProxyScrape SOCKS5',
    url: 'https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks5&timeout=10000&country=all',
    protocol: 'SOCKS5',
    parser: 'proxyScrapeAPI',
    rateLimit: 5000
  },

  // SpysOne.com (sin Cloudflare Enterprise)
  {
    name: 'Spys One',
    url: 'https://spys.one/en/free-proxy-list/',
    protocol: 'HTTP',
    parser: 'spysOne',
    rateLimit: 2500,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  },

  // ProxyNova.com
  {
    name: 'Proxy Nova',
    url: 'https://www.proxynova.com/proxy-server-list/',
    protocol: 'HTTP',
    parser: 'proxyNova',
    rateLimit: 2000
  }
];

// Fuentes adicionales de respaldo
export const BACKUP_SOURCES: ProxySource[] = [
  {
    name: 'GitHub Proxy List',
    url: 'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt',
    protocol: 'HTTP',
    parser: 'githubRaw',
    rateLimit: 1000
  },
  {
    name: 'Proxy List Plus',
    url: 'https://list.proxylistplus.com/Fresh-HTTP-Proxy-List-1',
    protocol: 'HTTP',
    parser: 'proxyListPlus',
    rateLimit: 2500
  }
];

export const getAllSources = (): ProxySource[] => [...PROXY_SOURCES, ...BACKUP_SOURCES]; 