import express from 'express';
import { eventManager } from '../services/event-manager.service.js';

const router = express.Router();

// SSE endpoint for real-time events
router.get('/stream', (req, res) => {
  // Generate unique client ID
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add CORS headers for SSE
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Cache-Control');
  
  // Add client to event manager
  eventManager.addClient(clientId, res);
  
  // Send immediate welcome message
  eventManager.emitLogEvent('info', `SSE client ${clientId} connected successfully`);
});

// Get connected clients info (for debugging/monitoring)
router.get('/clients', (req, res) => {
  const clients = eventManager.getClientsInfo();
  const count = eventManager.getConnectedClientsCount();
  
  res.json({
    success: true,
    data: {
      totalClients: count,
      clients: clients,
    },
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to emit events manually (for testing)
router.post('/test', (req, res) => {
  const { type, message, level } = req.body;
  
  if (type === 'log') {
    eventManager.emitLogEvent(level || 'info', message || 'Test message from API');
  } else if (type === 'scraping') {
    eventManager.emitScrapingEvent(
      req.body.progress || 50,
      req.body.proxiesFound || 10,
      req.body.currentSource || 'test-source',
      req.body.status || 'progress'
    );
  } else if (type === 'system') {
    eventManager.emitSystemEvent(
      req.body.event || 'server_error',
      req.body.data || { test: true }
    );
  }
  
  res.json({
    success: true,
    message: `Test event of type '${type}' emitted`,
    timestamp: new Date().toISOString()
  });
});

// Force heartbeat (for testing)
router.post('/heartbeat', (req, res) => {
  // This will trigger the regular heartbeat cycle
  eventManager.emitSystemEvent('connection_count', {
    forced: true,
    totalConnections: eventManager.getConnectedClientsCount()
  });
  
  res.json({
    success: true,
    message: 'Heartbeat event sent',
    clients: eventManager.getConnectedClientsCount(),
    timestamp: new Date().toISOString()
  });
});

export default router; 