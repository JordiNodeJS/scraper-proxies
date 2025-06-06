import express from 'express';
import cors from 'cors';
import { scrapingService } from './services/scraping.service.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Sistema de logs en memoria para el frontend
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'error' | 'warning' | 'success';
  message: string;
  source: 'backend';
}

const logs: LogEntry[] = [];
const MAX_LOGS = 100;

// Función helper para agregar logs
const addLog = (level: LogEntry['level'], message: string) => {
  const logEntry: LogEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    level,
    message,
    source: 'backend'
  };
  
  logs.push(logEntry);
  
  // Mantener solo los últimos 100 logs
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }
  
  // También hacer console.log para la consola del servidor
  const emoji = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : level === 'success' ? '✅' : '📋';
  console.log(`${emoji} [${level.toUpperCase()}] ${message}`);
};

// CORS Middleware mejorado
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware adicional para manejar preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

app.use(express.json());

// Middleware para logging de requests en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    addLog('info', `${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  addLog('info', 'Health check solicitado');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    runtime: 'bun',
    version: process.env.npm_package_version || '0.0.0'
  });
});

// Endpoint para obtener logs del backend
app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const recentLogs = logs.slice(-limit);
  
  res.json({
    success: true,
    data: {
      logs: recentLogs,
      total: logs.length,
      limit
    },
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify backend functionality
app.get('/api/test', (req, res) => {
  addLog('success', 'Test endpoint funcionando correctamente');
  res.json({
    message: '🚀 Backend is working correctly!',
    timestamp: new Date().toISOString(),
    server: 'Bun + Express',
    status: 'functional'
  });
});

// Mock scraping endpoint for testing
app.post('/api/scrape/test', (req, res) => {
  addLog('info', 'Iniciando scraping de prueba...');
  
  // Simulate scraping delay
  setTimeout(() => {
    const mockProxies = [
      { ip: '192.168.1.1', port: 8080, type: 'HTTP', country: 'US' },
      { ip: '192.168.1.2', port: 3128, type: 'HTTPS', country: 'CA' },
      { ip: '192.168.1.3', port: 1080, type: 'SOCKS5', country: 'DE' },
      { ip: '10.0.0.1', port: 3128, type: 'HTTP', country: 'FR' },
      { ip: '10.0.0.2', port: 8080, type: 'HTTPS', country: 'UK' }
    ];

    addLog('success', `Scraping de prueba completado: ${mockProxies.length} proxies encontrados`);

    res.json({
      success: true,
      data: {
        total: mockProxies.length,
        proxies: mockProxies,
        note: 'This is a test endpoint with mock data',
        source: 'proxy-list-download',
        scrapingTime: 1200 // ms
      },
      timestamp: new Date().toISOString()
    });
  }, 1000);
});

// Real scraping endpoint using Playwright
app.post('/api/scrape/real', async (req, res) => {
  addLog('info', 'Iniciando scraping real de proxies...');
  
  try {
    // Establecer timeout más corto para evitar requests colgados
    req.setTimeout(90000); // 90 segundos (1.5 minutos)
    
    const startTime = Date.now();
    addLog('info', 'Llamando al servicio de scraping...');
    
    // Crear una Promise con timeout personalizado
    const scrapingPromise = scrapingService.scrapeProxies();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Scraping timeout after 75 seconds'));
      }, 75000); // 75 segundos
    });
    
    // Race entre el scraping y el timeout
    const result = await Promise.race([scrapingPromise, timeoutPromise]) as any;
    const endTime = Date.now();
    
    if (!result || !result.success) {
      throw new Error('Scraping service returned invalid result');
    }
    
    // Formatear datos para el frontend
    const formattedProxies = (result.proxies || []).map((proxy: any) => ({
      ip: proxy.ip,
      port: proxy.port,
      type: (proxy.protocol || 'HTTP').toUpperCase(),
      country: proxy.country || 'Unknown',
      anonymity: proxy.anonymity || 'Unknown',
      speed: proxy.speed || null
    }));

    addLog('success', `Scraping real completado: ${formattedProxies.length} proxies en ${(endTime - startTime) / 1000}s`);

    res.json({
      success: true,
      data: {
        total: result.totalFound || formattedProxies.length,
        proxies: formattedProxies,
        note: 'Real proxies scraped from proxy-list-download',
        source: result.source?.name || 'proxy-list-download',
        sourceUrl: result.source?.url || 'https://www.proxy-list.download/HTTPS',
        scrapingTime: result.executionTime || (endTime - startTime),
        errors: result.errors?.length > 0 ? result.errors : undefined
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    addLog('error', `Error en scraping real: ${errorMessage}`);
    
    // Responder con error pero también incluir datos mock como fallback
    res.status(200).json({
      success: false,
      error: 'Error durante el scraping real',
      details: errorMessage,
      fallbackData: {
        total: 5,
        proxies: [
          { ip: '192.168.1.100', port: 8080, type: 'HTTP', country: 'Unknown', anonymity: 'Unknown' },
          { ip: '192.168.1.101', port: 3128, type: 'HTTPS', country: 'Unknown', anonymity: 'Unknown' },
          { ip: '192.168.1.102', port: 1080, type: 'SOCKS5', country: 'Unknown', anonymity: 'Unknown' },
          { ip: '192.168.1.103', port: 8080, type: 'HTTP', country: 'Unknown', anonymity: 'Unknown' },
          { ip: '192.168.1.104', port: 3128, type: 'HTTPS', country: 'Unknown', anonymity: 'Unknown' }
        ],
        note: 'Fallback data due to scraping error - Use /api/scrape/test for reliable mock data',
        source: 'fallback',
        scrapingTime: 1000
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para validar proxies
app.post('/api/validate/proxies', (req, res) => {
  const { proxies } = req.body;
  
  if (!proxies || !Array.isArray(proxies)) {
    addLog('warning', 'Solicitud de validación inválida: array de proxies requerido');
    return res.status(400).json({
      success: false,
      error: 'Se requiere un array de proxies',
      timestamp: new Date().toISOString()
    });
  }

  addLog('info', `Iniciando validación de ${proxies.length} proxies...`);

  // Simular validación con delay
  setTimeout(() => {
    const results = proxies.map(proxy => ({
      proxy,
      isWorking: Math.random() > 0.7, // 30% éxito simulado
      responseTime: Math.floor(Math.random() * 3000) + 500, // 500-3500ms
      checkedAt: new Date().toISOString(),
      error: Math.random() > 0.8 ? 'Connection timeout' : undefined
    }));

    const workingCount = results.filter(r => r.isWorking).length;
    addLog('success', `Validación completada: ${workingCount}/${proxies.length} proxies funcionando`);

    res.json({
      success: true,
      data: {
        total: proxies.length,
        working: workingCount,
        failed: proxies.length - workingCount,
        results
      },
      timestamp: new Date().toISOString()
    });
  }, 2000);
});

// Endpoint para estadísticas
app.get('/api/stats', (req, res) => {
  addLog('info', 'Estadísticas solicitadas');
  
  const mockStats = {
    totalProxiesScraped: 1250,
    totalProxiesValidated: 890,
    workingProxies: 234,
    averageResponseTime: 1850,
    uptime: '2 days 14h 32m',
    lastScrape: new Date(Date.now() - 1800000).toISOString(), // hace 30 min
    sources: [
      {
        name: 'proxy-list-download',
        proxiesFound: 45,
        lastUpdate: new Date(Date.now() - 900000).toISOString(), // hace 15 min
        status: 'active'
      },
      {
        name: 'spys.one',
        proxiesFound: 23,
        lastUpdate: new Date(Date.now() - 1800000).toISOString(), // hace 30 min
        status: 'active'
      },
      {
        name: 'free-proxy-list',
        proxiesFound: 67,
        lastUpdate: new Date(Date.now() - 3600000).toISOString(), // hace 1 hora
        status: 'inactive'
      }
    ]
  };

  res.json(mockStats);
});

// Endpoint para obtener configuración del scraper
app.get('/api/config', (req, res) => {
  addLog('info', 'Configuración solicitada');
  
  res.json({
    availableSources: [
      'proxy-list-download',
      'spys.one',
      'free-proxy-list',
      'proxy-daily'
    ],
    defaultTimeout: 5000,
    maxConcurrentValidations: 50,
    supportedProxyTypes: ['HTTP', 'HTTPS', 'SOCKS4', 'SOCKS5']
  });
});

// Endpoint para scraping directo de proxies reales con múltiples fuentes
app.post('/api/scrape/direct', async (req, res) => {
  addLog('info', 'Iniciando scraping directo de proxies reales...');
  
  try {
    const startTime = Date.now();
    const allProxies: any[] = [];
    
    // Fuente 1: Free Proxy List API
    try {
      addLog('info', 'Intentando Free Proxy List API...');
      const freeProxyResponse = await fetch('https://www.proxy-list.download/api/v1/get?type=http', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/plain'
        },
        signal: AbortSignal.timeout(10000) // 10 segundos
      });
      
      if (freeProxyResponse.ok) {
        const textData = await freeProxyResponse.text();
        const lines = textData.trim().split('\n').filter(line => line.includes(':'));
        
        for (const line of lines.slice(0, 10)) { // Limitar a 10 primeros
          const [ip, port] = line.trim().split(':');
          if (ip && port && isValidIP(ip) && isPublicIP(ip)) {
            allProxies.push({
              ip: ip.trim(),
              port: parseInt(port.trim()),
              type: 'HTTP',
              country: 'Unknown',
              anonymity: 'Unknown',
              source: 'free-proxy-list'
            });
          }
        }
        addLog('success', `Free Proxy List: ${lines.length} proxies encontrados`);
      }
    } catch (error) {
      addLog('warning', `Free Proxy List falló: ${error}`);
    }
    
    // Fuente 2: ProxyScrape API
    try {
      addLog('info', 'Intentando ProxyScrape API...');
      const proxyScrapeResponse = await fetch('https://api.proxyscrape.com/v2/?request=get&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (proxyScrapeResponse.ok) {
        const textData = await proxyScrapeResponse.text();
        const lines = textData.trim().split('\n').filter(line => line.includes(':'));
        
        for (const line of lines.slice(0, 10)) {
          const [ip, port] = line.trim().split(':');
          if (ip && port && isValidIP(ip) && isPublicIP(ip)) {
            allProxies.push({
              ip: ip.trim(),
              port: parseInt(port.trim()),
              type: 'HTTP',
              country: 'Unknown',
              anonymity: 'Unknown',
              source: 'proxyscrape'
            });
          }
        }
        addLog('success', `ProxyScrape: ${lines.length} proxies encontrados`);
      }
    } catch (error) {
      addLog('warning', `ProxyScrape falló: ${error}`);
    }
    
    // Fuente 3: GitHub Proxy Lists
    try {
      addLog('info', 'Intentando GitHub Proxy Lists...');
      const githubResponse = await fetch('https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (githubResponse.ok) {
        const textData = await githubResponse.text();
        const lines = textData.trim().split('\n').filter(line => line.includes(':'));
        
        for (const line of lines.slice(0, 15)) {
          const [ip, port] = line.trim().split(':');
          if (ip && port && isValidIP(ip) && isPublicIP(ip)) {
            allProxies.push({
              ip: ip.trim(),
              port: parseInt(port.trim()),
              type: 'HTTP',
              country: 'Unknown',
              anonymity: 'Unknown',
              source: 'github-speedx'
            });
          }
        }
        addLog('success', `GitHub SpeedX: ${lines.length} proxies encontrados`);
      }
    } catch (error) {
      addLog('warning', `GitHub SpeedX falló: ${error}`);
    }
    
    // Fuente 4: PubProxy API
    try {
      addLog('info', 'Intentando PubProxy API...');
      const pubproxyResponse = await fetch('http://pubproxy.com/api/proxy?limit=10&format=txt&type=http', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (pubproxyResponse.ok) {
        const textData = await pubproxyResponse.text();
        const lines = textData.trim().split('\n').filter(line => line.includes(':'));
        
        for (const line of lines) {
          const [ip, port] = line.trim().split(':');
          if (ip && port && isValidIP(ip) && isPublicIP(ip)) {
            allProxies.push({
              ip: ip.trim(),
              port: parseInt(port.trim()),
              type: 'HTTP',
              country: 'Unknown',
              anonymity: 'Unknown',
              source: 'pubproxy'
            });
          }
        }
        addLog('success', `PubProxy: ${lines.length} proxies encontrados`);
      }
    } catch (error) {
      addLog('warning', `PubProxy falló: ${error}`);
    }
    
    // Filtrar duplicados basados en IP:PORT
    const uniqueProxies = allProxies.filter((proxy, index, self) => 
      index === self.findIndex(p => p.ip === proxy.ip && p.port === proxy.port)
    );
    
    const endTime = Date.now();
    const scrapingTime = endTime - startTime;
    
    if (uniqueProxies.length > 0) {
      addLog('success', `Scraping directo completado: ${uniqueProxies.length} proxies únicos en ${scrapingTime}ms`);
      
      res.json({
        success: true,
        data: {
          total: uniqueProxies.length,
          proxies: uniqueProxies,
          note: 'Proxies reales obtenidos de múltiples fuentes públicas',
          sources: ['free-proxy-list', 'proxyscrape', 'github-speedx', 'pubproxy'],
          scrapingTime: scrapingTime,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('No se pudieron obtener proxies de ninguna fuente');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    addLog('error', `Error en scraping directo: ${errorMessage}`);
    
    res.json({
      success: false,
      error: 'Error en scraping directo de proxies reales',
      details: errorMessage,
      fallbackError: 'Todas las fuentes de proxies fallaron',
      timestamp: new Date().toISOString()
    });
  }
});

// Función auxiliar para validar IP
function isValidIP(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

// Función auxiliar para verificar si es IP pública
function isPublicIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  
  // Verificar rangos de IP privadas
  if (parts[0] === 10) return false; // 10.0.0.0/8
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false; // 172.16.0.0/12
  if (parts[0] === 192 && parts[1] === 168) return false; // 192.168.0.0/16
  if (parts[0] === 127) return false; // 127.0.0.0/8 (loopback)
  if (parts[0] === 169 && parts[1] === 254) return false; // 169.254.0.0/16 (link-local)
  
  return true;
}

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  addLog('error', `Server error: ${err.message}`);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  addLog('warning', `Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  addLog('success', `Backend server running on port ${PORT}`);
  addLog('info', `Health check: http://localhost:${PORT}/health`);
  addLog('info', `Test endpoint: http://localhost:${PORT}/api/test`);
  addLog('info', `Environment: ${process.env.NODE_ENV || 'development'}`);
  addLog('info', `Stats endpoint: http://localhost:${PORT}/api/stats`);
  addLog('info', `Config endpoint: http://localhost:${PORT}/api/config`);
  addLog('info', `Logs endpoint: http://localhost:${PORT}/api/logs`);
});

export default app; 