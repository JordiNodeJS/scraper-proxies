import type { 
  ServerEvent, 
  SSEConnectionState, 
  SSEEventHandlers, 
  SSEConfig,
  LogEvent,
  ScrapingEvent,
  SystemEvent,
  HeartbeatEvent
} from '../types/events.types';

class EventStreamService {
  private eventSource: EventSource | null = null;
  private config: SSEConfig;
  private handlers: SSEEventHandlers = {};
  private connectionState: SSEConnectionState = 'disconnected';
  private retryCount = 0;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: SSEConfig) {
    this.config = {
      retryDelay: 3000,
      maxRetries: 10,
      heartbeatTimeout: 60000, // 60 seconds
      autoReconnect: true,
      ...config
    };
  }

  // Connect to SSE stream
  connect(): void {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log('SSE already connected');
      return;
    }

    this.setConnectionState('connecting');
    console.log(`🔌 Connecting to SSE at ${this.config.url}`);

    try {
      this.eventSource = new EventSource(this.config.url, {
        withCredentials: true
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      this.setConnectionState('error');
      this.handleReconnect();
    }
  }

  // Disconnect from SSE stream
  disconnect(): void {
    console.log('🔌 Disconnecting SSE...');
    
    this.clearTimeouts();
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.setConnectionState('disconnected');
    this.retryCount = 0;
  }

  // Register event handlers
  on(handlers: SSEEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  // Remove event handlers
  off(handlerKeys: (keyof SSEEventHandlers)[]): void {
    handlerKeys.forEach(key => {
      delete this.handlers[key];
    });
  }

  // Get current connection state
  getConnectionState(): SSEConnectionState {
    return this.connectionState;
  }

  // Setup EventSource event listeners
  private setupEventListeners(): void {
    if (!this.eventSource) return;

    // Connection opened
    this.eventSource.onopen = () => {
      console.log('✅ SSE connection established');
      this.setConnectionState('connected');
      this.retryCount = 0;
      this.startHeartbeatMonitor();
    };

    // Connection error
    this.eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.setConnectionState('disconnected');
        this.handleReconnect();
      } else {
        this.setConnectionState('error');
      }
      
      this.handlers.onError?.(error);
    };

    // Handle specific event types
    this.eventSource.addEventListener('log', (event) => {
      this.handleLogEvent(event);
    });

    this.eventSource.addEventListener('scraping_progress', (event) => {
      this.handleScrapingEvent(event);
    });

    this.eventSource.addEventListener('system', (event) => {
      this.handleSystemEvent(event);
    });

    this.eventSource.addEventListener('heartbeat', (event) => {
      this.handleHeartbeatEvent(event);
    });

    // Handle generic message events (fallback)
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ServerEvent;
        this.routeEvent(data);
      } catch (error) {
        console.warn('Failed to parse SSE message:', error, event.data);
      }
    };
  }

  // Handle log events
  private handleLogEvent(event: MessageEvent): void {
    try {
      const logEvent = JSON.parse(event.data) as LogEvent;
      console.log(`📋 [SSE LOG] ${logEvent.level.toUpperCase()}: ${logEvent.message}`);
      this.handlers.onLog?.(logEvent);
    } catch (error) {
      console.error('Failed to parse log event:', error);
    }
  }

  // Handle scraping progress events
  private handleScrapingEvent(event: MessageEvent): void {
    try {
      const scrapingEvent = JSON.parse(event.data) as ScrapingEvent;
      console.log(`🔄 [SSE SCRAPING] ${scrapingEvent.status}: ${scrapingEvent.progress}% - ${scrapingEvent.proxiesFound} proxies from ${scrapingEvent.currentSource}`);
      this.handlers.onScrapingProgress?.(scrapingEvent);
    } catch (error) {
      console.error('Failed to parse scraping event:', error);
    }
  }

  // Handle system events
  private handleSystemEvent(event: MessageEvent): void {
    try {
      const systemEvent = JSON.parse(event.data) as SystemEvent;
      console.log(`🔧 [SSE SYSTEM] ${systemEvent.event}:`, systemEvent.data);
      this.handlers.onSystem?.(systemEvent);
    } catch (error) {
      console.error('Failed to parse system event:', error);
    }
  }

  // Handle heartbeat events
  private handleHeartbeatEvent(event: MessageEvent): void {
    try {
      const heartbeatEvent = JSON.parse(event.data) as HeartbeatEvent;
      console.log(`💓 [SSE HEARTBEAT] Uptime: ${Math.floor(heartbeatEvent.uptime / 1000)}s, Connections: ${heartbeatEvent.activeConnections}`);
      this.handlers.onHeartbeat?.(heartbeatEvent);
      this.resetHeartbeatMonitor();
    } catch (error) {
      console.error('Failed to parse heartbeat event:', error);
    }
  }

  // Route events based on type
  private routeEvent(event: ServerEvent): void {
    switch (event.type) {
      case 'log':
        this.handlers.onLog?.(event as LogEvent);
        break;
      case 'scraping_progress':
        this.handlers.onScrapingProgress?.(event as ScrapingEvent);
        break;
      case 'system':
        this.handlers.onSystem?.(event as SystemEvent);
        break;
      case 'heartbeat':
        this.handlers.onHeartbeat?.(event as HeartbeatEvent);
        this.resetHeartbeatMonitor();
        break;
      default:
        console.warn('Unknown event type:', event.type);
    }
  }

  // Set connection state and notify handlers
  private setConnectionState(state: SSEConnectionState): void {
    if (this.connectionState !== state) {
      console.log(`📡 SSE state change: ${this.connectionState} → ${state}`);
      this.connectionState = state;
      this.handlers.onConnectionChange?.(state);
    }
  }

  // Handle reconnection logic
  private handleReconnect(): void {
    if (!this.config.autoReconnect) {
      console.log('Auto-reconnect disabled');
      return;
    }

    if (this.retryCount >= (this.config.maxRetries || 10)) {
      console.error(`Max retries (${this.config.maxRetries}) exceeded. Giving up.`);
      this.setConnectionState('error');
      return;
    }

    this.retryCount++;
    const delay = this.config.retryDelay! * Math.min(this.retryCount, 5); // Exponential backoff (capped)
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.retryCount}/${this.config.maxRetries})`);
    this.setConnectionState('reconnecting');

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Start heartbeat monitor
  private startHeartbeatMonitor(): void {
    this.resetHeartbeatMonitor();
  }

  // Reset heartbeat monitor
  private resetHeartbeatMonitor(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    this.heartbeatTimeout = setTimeout(() => {
      console.warn('⚠️ Heartbeat timeout - connection may be lost');
      this.setConnectionState('error');
      this.handleReconnect();
    }, this.config.heartbeatTimeout!);
  }

  // Clear all timeouts
  private clearTimeouts(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Get connection statistics
  getStats() {
    return {
      connectionState: this.connectionState,
      retryCount: this.retryCount,
      isConnected: this.eventSource?.readyState === EventSource.OPEN,
      url: this.config.url
    };
  }
}

export { EventStreamService }; 