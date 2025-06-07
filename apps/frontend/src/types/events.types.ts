// Types for Server-Sent Events system (Frontend)

export interface BaseEvent {
  id: string;
  type: string;
  timestamp: string;
  source: 'backend' | 'scraping' | 'system';
}

export interface LogEvent extends BaseEvent {
  type: 'log';
  level: 'info' | 'error' | 'warning' | 'success';
  message: string;
}

export interface ScrapingEvent extends BaseEvent {
  type: 'scraping_progress';
  progress: number;
  proxiesFound: number;
  currentSource: string;
  status: 'started' | 'progress' | 'completed' | 'error';
  error?: string;
}

export interface SystemEvent extends BaseEvent {
  type: 'system';
  event: 'server_start' | 'server_error' | 'high_load' | 'connection_count';
  data?: any;
}

export interface HeartbeatEvent extends BaseEvent {
  type: 'heartbeat';
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  activeConnections: number;
}

export type ServerEvent = LogEvent | ScrapingEvent | SystemEvent | HeartbeatEvent;

// SSE Connection states
export type SSEConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

// SSE Event handlers
export interface SSEEventHandlers {
  onLog?: (event: LogEvent) => void;
  onScrapingProgress?: (event: ScrapingEvent) => void;
  onSystem?: (event: SystemEvent) => void;
  onHeartbeat?: (event: HeartbeatEvent) => void;
  onConnectionChange?: (state: SSEConnectionState) => void;
  onError?: (error: Event) => void;
}

// SSE Configuration
export interface SSEConfig {
  url: string;
  retryDelay?: number;
  maxRetries?: number;
  heartbeatTimeout?: number;
  autoReconnect?: boolean;
} 