import { useEffect, useRef, useState, useCallback } from 'react';
import { EventStreamService } from '../services/event-stream.service';
import type { 
  SSEConnectionState, 
  SSEEventHandlers, 
  LogEvent, 
  ScrapingEvent, 
  SystemEvent, 
  HeartbeatEvent 
} from '../types/events.types';

interface UseServerEventsOptions {
  autoConnect?: boolean;
  retryDelay?: number;
  maxRetries?: number;
  heartbeatTimeout?: number;
}

interface UseServerEventsReturn {
  connectionState: SSEConnectionState;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  retryCount: number;
  lastLog: LogEvent | null;
  lastScrapingEvent: ScrapingEvent | null;
  lastSystemEvent: SystemEvent | null;
  lastHeartbeat: HeartbeatEvent | null;
  stats: {
    connectionState: SSEConnectionState;
    retryCount: number;
    isConnected: boolean;
    url: string;
  };
}

export const useServerEvents = (
  baseUrl: string = 'http://localhost:3001',
  options: UseServerEventsOptions = {},
  handlers: Partial<SSEEventHandlers> = {}
): UseServerEventsReturn => {
  const [connectionState, setConnectionState] = useState<SSEConnectionState>('disconnected');
  const [lastLog, setLastLog] = useState<LogEvent | null>(null);
  const [lastScrapingEvent, setLastScrapingEvent] = useState<ScrapingEvent | null>(null);
  const [lastSystemEvent, setLastSystemEvent] = useState<SystemEvent | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<HeartbeatEvent | null>(null);
  const [stats, setStats] = useState({
    connectionState: 'disconnected' as SSEConnectionState,
    retryCount: 0,
    isConnected: false,
    url: ''
  });

  const eventServiceRef = useRef<EventStreamService | null>(null);

  // Initialize EventStreamService
  useEffect(() => {
    const sseUrl = `${baseUrl}/api/events/stream`;
    
    eventServiceRef.current = new EventStreamService({
      url: sseUrl,
      retryDelay: options.retryDelay || 3000,
      maxRetries: options.maxRetries || 10,
      heartbeatTimeout: options.heartbeatTimeout || 60000,
      autoReconnect: true
    });

    // Setup event handlers
    eventServiceRef.current.on({
      onLog: (event: LogEvent) => {
        setLastLog(event);
        handlers.onLog?.(event);
      },
      onScrapingProgress: (event: ScrapingEvent) => {
        setLastScrapingEvent(event);
        handlers.onScrapingProgress?.(event);
      },
      onSystem: (event: SystemEvent) => {
        setLastSystemEvent(event);
        handlers.onSystem?.(event);
      },
      onHeartbeat: (event: HeartbeatEvent) => {
        setLastHeartbeat(event);
        handlers.onHeartbeat?.(event);
      },
      onConnectionChange: (state: SSEConnectionState) => {
        setConnectionState(state);
        handlers.onConnectionChange?.(state);
        
        // Update stats
        if (eventServiceRef.current) {
          setStats(eventServiceRef.current.getStats());
        }
      },
      onError: (error: Event) => {
        console.error('SSE Error in hook:', error);
        handlers.onError?.(error);
      }
    });

    // Auto-connect if enabled
    if (options.autoConnect !== false) {
      eventServiceRef.current.connect();
    }

    // Cleanup on unmount
    return () => {
      if (eventServiceRef.current) {
        eventServiceRef.current.disconnect();
      }
    };
  }, [baseUrl, options.retryDelay, options.maxRetries, options.heartbeatTimeout, options.autoConnect]);

  // Update handlers when they change
  useEffect(() => {
    if (eventServiceRef.current) {
      eventServiceRef.current.on({
        onLog: (event: LogEvent) => {
          setLastLog(event);
          handlers.onLog?.(event);
        },
        onScrapingProgress: (event: ScrapingEvent) => {
          setLastScrapingEvent(event);
          handlers.onScrapingProgress?.(event);
        },
        onSystem: (event: SystemEvent) => {
          setLastSystemEvent(event);
          handlers.onSystem?.(event);
        },
        onHeartbeat: (event: HeartbeatEvent) => {
          setLastHeartbeat(event);
          handlers.onHeartbeat?.(event);
        },
        onConnectionChange: (state: SSEConnectionState) => {
          setConnectionState(state);
          handlers.onConnectionChange?.(state);
        },
        onError: handlers.onError
      });
    }
  }, [handlers]);

  // Connect function
  const connect = useCallback(() => {
    if (eventServiceRef.current) {
      eventServiceRef.current.connect();
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (eventServiceRef.current) {
      eventServiceRef.current.disconnect();
    }
  }, []);

  // Computed values
  const isConnected = connectionState === 'connected';
  const retryCount = stats.retryCount;

  return {
    connectionState,
    connect,
    disconnect,
    isConnected,
    retryCount,
    lastLog,
    lastScrapingEvent,
    lastSystemEvent,
    lastHeartbeat,
    stats
  };
}; 