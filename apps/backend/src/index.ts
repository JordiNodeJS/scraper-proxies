import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Middleware mejorado
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
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
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    runtime: 'bun',
    version: process.env.npm_package_version || '0.0.0'
  });
});

// Test endpoint to verify backend functionality
app.get('/api/test', (req, res) => {
  res.json({
    message: '🚀 Backend is working correctly!',
    timestamp: new Date().toISOString(),
    server: 'Bun + Express',
    status: 'functional'
  });
});

// Mock scraping endpoint for testing
app.post('/api/scrape/test', (req, res) => {
  // Simulate scraping delay
  setTimeout(() => {
    const mockProxies = [
      { ip: '192.168.1.1', port: 8080, type: 'HTTP', country: 'US' },
      { ip: '192.168.1.2', port: 3128, type: 'HTTPS', country: 'CA' },
      { ip: '192.168.1.3', port: 1080, type: 'SOCKS5', country: 'DE' },
      { ip: '10.0.0.1', port: 3128, type: 'HTTP', country: 'FR' },
      { ip: '10.0.0.2', port: 8080, type: 'HTTPS', country: 'UK' }
    ];

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

// Endpoint para validar proxies
app.post('/api/validate/proxies', (req, res) => {
  const { proxies } = req.body;
  
  if (!proxies || !Array.isArray(proxies)) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere un array de proxies',
      timestamp: new Date().toISOString()
    });
  }

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

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Stats endpoint: http://localhost:${PORT}/api/stats`);
  console.log(`⚙️  Config endpoint: http://localhost:${PORT}/api/config`);
});

export default app; 