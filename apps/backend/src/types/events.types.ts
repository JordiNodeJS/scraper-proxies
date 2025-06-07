// Types for Server-Sent Events system

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
  memoryUsage: NodeJS.MemoryUsage;
  activeConnections: number;
}

export type ServerEvent = LogEvent | ScrapingEvent | SystemEvent | HeartbeatEvent;

// SSE Client connection interface
export interface SSEClient {
  id: string;
  response: Response;
  connected: boolean;
  connectedAt: Date;
  lastPing: Date;
}

// Event subscription types
export type EventType = 'log' | 'scraping_progress' | 'system' | 'heartbeat' | '*';

export interface EventSubscription {
  clientId: string;
  eventTypes: EventType[];
} 