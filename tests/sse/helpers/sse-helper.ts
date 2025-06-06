import { Page, Browser, BrowserContext } from '@playwright/test';

export interface SSEEvent {
  id: string;
  type: string;
  data: string;
  timestamp: number;
}

export interface SSETestConfig {
  url: string;
  timeout?: number;
  expectedEvents?: string[];
  retryDelay?: number;
}

export class SSETestHelper {
  private page: Page;
  private events: SSEEvent[] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Initialize SSE connection and start capturing events
   */
  async startSSECapture(config: SSETestConfig): Promise<void> {
    const { url, timeout = 30000 } = config;

    // Inject EventSource monitoring script
    await this.page.addInitScript(() => {
      (window as any).sseEvents = [];
      (window as any).sseConnectionState = 'disconnected';
      
      // Store original EventSource
      const OriginalEventSource = window.EventSource;
      
      // Create wrapper to capture events
      window.EventSource = class extends OriginalEventSource {
        constructor(url: string | URL, options?: EventSourceInit) {
          super(url, options);
          
          (window as any).sseConnectionState = 'connecting';
          
          this.onopen = (event) => {
            (window as any).sseConnectionState = 'connected';
            (window as any).sseEvents.push({
              type: 'connection',
              data: 'opened',
              timestamp: Date.now(),
              id: 'connection-' + Date.now()
            });
          };
          
          this.onerror = (event) => {
            (window as any).sseConnectionState = 'error';
            (window as any).sseEvents.push({
              type: 'connection',
              data: 'error',
              timestamp: Date.now(),
              id: 'error-' + Date.now()
            });
          };
          
          this.onmessage = (event) => {
            (window as any).sseEvents.push({
              type: 'message',
              data: event.data,
              timestamp: Date.now(),
              id: event.lastEventId || 'message-' + Date.now()
            });
          };
          
          // Capture typed events
          this.addEventListener('log', (event: any) => {
            (window as any).sseEvents.push({
              type: 'log',
              data: event.data,
              timestamp: Date.now(),
              id: event.lastEventId || 'log-' + Date.now()
            });
          });
          
          this.addEventListener('scraping_progress', (event: any) => {
            (window as any).sseEvents.push({
              type: 'scraping_progress', 
              data: event.data,
              timestamp: Date.now(),
              id: event.lastEventId || 'scraping-' + Date.now()
            });
          });
          
          this.addEventListener('system', (event: any) => {
            (window as any).sseEvents.push({
              type: 'system',
              data: event.data,
              timestamp: Date.now(),
              id: event.lastEventId || 'system-' + Date.now()
            });
          });
          
          this.addEventListener('heartbeat', (event: any) => {
            (window as any).sseEvents.push({
              type: 'heartbeat',
              data: event.data,
              timestamp: Date.now(),
              id: event.lastEventId || 'heartbeat-' + Date.now()
            });
          });
        }
      };
    });
  }

  /**
   * Wait for SSE connection to be established
   */
  async waitForConnection(timeout: number = 10000): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        () => (window as any).sseConnectionState === 'connected',
        { timeout }
      );
      return true;
    } catch (error) {
      console.error('SSE connection timeout:', error);
      return false;
    }
  }

  /**
   * Wait for a specific event type
   */
  async waitForEvent(eventType: string, timeout: number = 5000): Promise<SSEEvent | null> {
    try {
      await this.page.waitForFunction(
        (type) => {
          const events = (window as any).sseEvents || [];
          return events.some((event: any) => event.type === type);
        },
        eventType,
        { timeout }
      );
      
      const events = await this.getEvents();
      return events.find(event => event.type === eventType) || null;
    } catch (error) {
      console.error(`Timeout waiting for event: ${eventType}`, error);
      return null;
    }
  }

  /**
   * Wait for multiple events of specific type
   */
  async waitForEvents(eventType: string, count: number, timeout: number = 10000): Promise<SSEEvent[]> {
    try {
      await this.page.waitForFunction(
        (args) => {
          const events = (window as any).sseEvents || [];
          return events.filter((event: any) => event.type === args.type).length >= args.count;
        },
        { type: eventType, count },
        { timeout }
      );
      
      const events = await this.getEvents();
      return events.filter(event => event.type === eventType).slice(0, count);
    } catch (error) {
      console.error(`Timeout waiting for ${count} events of type: ${eventType}`, error);
      return [];
    }
  }

  /**
   * Get all captured events
   */
  async getEvents(): Promise<SSEEvent[]> {
    const events = await this.page.evaluate(() => (window as any).sseEvents || []);
    return events;
  }

  /**
   * Get events by type
   */
  async getEventsByType(eventType: string): Promise<SSEEvent[]> {
    const events = await this.getEvents();
    return events.filter(event => event.type === eventType);
  }

  /**
   * Get connection state
   */
  async getConnectionState(): Promise<string> {
    return await this.page.evaluate(() => (window as any).sseConnectionState || 'disconnected');
  }

  /**
   * Clear captured events
   */
  async clearEvents(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).sseEvents = [];
    });
  }

  /**
   * Count events by type
   */
  async countEventsByType(eventType: string): Promise<number> {
    const events = await this.getEventsByType(eventType);
    return events.length;
  }

  /**
   * Validate event data structure
   */
  validateEvent(event: SSEEvent, expectedType: string): boolean {
    if (!event) return false;
    if (event.type !== expectedType) return false;
    if (!event.data) return false;
    if (!event.timestamp) return false;
    
    try {
      // Try to parse event data as JSON for typed events
      if (expectedType !== 'connection') {
        const parsedData = JSON.parse(event.data);
        if (!parsedData.id || !parsedData.type || !parsedData.timestamp) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Invalid event data format:', error);
      return false;
    }
  }

  /**
   * Validate log event structure
   */
  validateLogEvent(event: SSEEvent): boolean {
    if (!this.validateEvent(event, 'log')) return false;
    
    try {
      const data = JSON.parse(event.data);
      return data.level && data.message && ['info', 'error', 'warning', 'success'].includes(data.level);
    } catch {
      return false;
    }
  }

  /**
   * Validate scraping event structure
   */
  validateScrapingEvent(event: SSEEvent): boolean {
    if (!this.validateEvent(event, 'scraping_progress')) return false;
    
    try {
      const data = JSON.parse(event.data);
      return typeof data.progress === 'number' && 
             typeof data.proxiesFound === 'number' &&
             data.currentSource &&
             ['started', 'progress', 'completed', 'error'].includes(data.status);
    } catch {
      return false;
    }
  }

  /**
   * Validate heartbeat event structure
   */
  validateHeartbeatEvent(event: SSEEvent): boolean {
    if (!this.validateEvent(event, 'heartbeat')) return false;
    
    try {
      const data = JSON.parse(event.data);
      return typeof data.uptime === 'number' && 
             typeof data.activeConnections === 'number' &&
             data.memoryUsage;
    } catch {
      return false;
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(): Promise<{[key: string]: number}> {
    const events = await this.getEvents();
    const stats: {[key: string]: number} = {};
    
    events.forEach(event => {
      stats[event.type] = (stats[event.type] || 0) + 1;
    });
    
    return stats;
  }
}

/**
 * Create SSE test helper for a page
 */
export function createSSEHelper(page: Page): SSETestHelper {
  return new SSETestHelper(page);
}

/**
 * Common SSE test configurations
 */
export const SSE_TEST_CONFIGS = {
  LOCAL_DEV: {
    url: 'http://localhost:3002/api/events/stream',
    timeout: 30000,
    expectedEvents: ['log', 'heartbeat', 'system'],
    retryDelay: 3000
  },
  PRODUCTION: {
    url: 'http://localhost:3001/api/events/stream', 
    timeout: 15000,
    expectedEvents: ['log', 'heartbeat'],
    retryDelay: 5000
  }
};

/**
 * Test data for SSE events
 */
export const TEST_EVENTS = {
  LOG_EVENT: {
    type: 'log',
    level: 'info',
    message: 'Test log message from Playwright'
  },
  SCRAPING_EVENT: {
    type: 'scraping',
    progress: 50,
    proxiesFound: 25,
    currentSource: 'test-source',
    status: 'progress'
  },
  SYSTEM_EVENT: {
    type: 'system',
    event: 'server_error',
    data: { test: true }
  }
}; 