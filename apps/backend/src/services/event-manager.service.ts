import { EventEmitter } from 'events';
import { Response } from 'express';
import { 
  ServerEvent, 
  SSEClient, 
  EventType, 
  LogEvent, 
  ScrapingEvent, 
  SystemEvent, 
  HeartbeatEvent 
} from '../types/events.types.js';

class EventManagerService extends EventEmitter {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private serverStartTime: Date = new Date();

  constructor() {
    super();
    this.startHeartbeat();
    this.emitSystemEvent('server_start', { startTime: this.serverStartTime });
  }

  // Add a new SSE client
  addClient(clientId: string, response: Response): void {
    // Configure SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Credentials': 'true',
    });

    const client: SSEClient = {
      id: clientId,
      response: response as any, // Type assertion for Express Response
      connected: true,
      connectedAt: new Date(),
      lastPing: new Date(),
    };

    this.clients.set(clientId, client);
    
    // Send initial connection event
    this.sendToClient(clientId, this.createSystemEvent('connection_count', {
      connected: true,
      totalConnections: this.clients.size,
    }));

    // Handle client disconnection
    response.on('close', () => {
      this.removeClient(clientId);
    });

    response.on('error', (error) => {
      console.error(`SSE client ${clientId} error:`, error);
      this.removeClient(clientId);
    });

    console.log(`✅ SSE Client connected: ${clientId} (Total: ${this.clients.size})`);
  }

  // Remove a client
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.connected = false;
      this.clients.delete(clientId);
      
      this.emitSystemEvent('connection_count', {
        disconnected: true,
        clientId,
        totalConnections: this.clients.size,
      });

      console.log(`❌ SSE Client disconnected: ${clientId} (Remaining: ${this.clients.size})`);
    }
  }

  // Send event to specific client
  private sendToClient(clientId: string, event: ServerEvent): void {
    const client = this.clients.get(clientId);
    if (!client || !client.connected) {
      return;
    }

    try {
      const response = client.response as any;
      const eventData = `data: ${JSON.stringify(event)}\n`;
      const eventType = `event: ${event.type}\n`;
      const eventId = `id: ${event.id}\n\n`;
      
      response.write(eventType + eventData + eventId);
      client.lastPing = new Date();
    } catch (error) {
      console.error(`Error sending event to client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }

  // Broadcast event to all clients
  broadcast(event: ServerEvent): void {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, event);
    });
  }

  // Emit a log event
  emitLogEvent(level: LogEvent['level'], message: string): void {
    const event: LogEvent = {
      id: this.generateEventId(),
      type: 'log',
      timestamp: new Date().toISOString(),
      source: 'backend',
      level,
      message,
    };

    this.broadcast(event);
    this.emit('log', event);
  }

  // Emit a scraping progress event
  emitScrapingEvent(
    progress: number, 
    proxiesFound: number, 
    currentSource: string, 
    status: ScrapingEvent['status'],
    error?: string
  ): void {
    const event: ScrapingEvent = {
      id: this.generateEventId(),
      type: 'scraping_progress',
      timestamp: new Date().toISOString(),
      source: 'scraping',
      progress,
      proxiesFound,
      currentSource,
      status,
      error,
    };

    this.broadcast(event);
    this.emit('scraping_progress', event);
  }

  // Emit a system event
  emitSystemEvent(systemEvent: SystemEvent['event'], data?: any): void {
    const event: SystemEvent = {
      id: this.generateEventId(),
      type: 'system',
      timestamp: new Date().toISOString(),
      source: 'system',
      event: systemEvent,
      data,
    };

    this.broadcast(event);
    this.emit('system', event);
  }

  // Create system event (helper)
  private createSystemEvent(systemEvent: SystemEvent['event'], data?: any): SystemEvent {
    return {
      id: this.generateEventId(),
      type: 'system',
      timestamp: new Date().toISOString(),
      source: 'system',
      event: systemEvent,
      data,
    };
  }

  // Send heartbeat to all clients
  private sendHeartbeat(): void {
    const uptime = Date.now() - this.serverStartTime.getTime();
    const memoryUsage = process.memoryUsage();
    
    const event: HeartbeatEvent = {
      id: this.generateEventId(),
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      source: 'system',
      uptime,
      memoryUsage,
      activeConnections: this.clients.size,
    };

    this.broadcast(event);
  }

  // Start heartbeat interval
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Every 30 seconds
  }

  // Stop heartbeat interval
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Generate unique event ID
  private generateEventId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  // Get client information
  getClientsInfo(): Array<{id: string, connectedAt: Date, lastPing: Date}> {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      connectedAt: client.connectedAt,
      lastPing: client.lastPing,
    }));
  }

  // Cleanup on shutdown
  cleanup(): void {
    this.stopHeartbeat();
    this.clients.forEach((client, clientId) => {
      this.removeClient(clientId);
    });
    this.removeAllListeners();
  }
}

// Create singleton instance
export const eventManager = new EventManagerService();

// Export the class for testing
export { EventManagerService }; 