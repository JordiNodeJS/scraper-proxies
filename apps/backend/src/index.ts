import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

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
      { ip: '192.168.1.3', port: 1080, type: 'SOCKS5', country: 'DE' }
    ];

    res.json({
      success: true,
      data: {
        total: mockProxies.length,
        proxies: mockProxies,
        note: 'This is a test endpoint with mock data'
      },
      timestamp: new Date().toISOString()
    });
  }, 1000);
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
});

export default app; 