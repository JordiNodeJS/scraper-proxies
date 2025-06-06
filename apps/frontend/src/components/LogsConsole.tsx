import { useState, useEffect, useRef } from 'react';
import { useBackendLogs } from '../hooks/useApi';
import type { BackendLogEntry } from '../services/api';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'error' | 'warning' | 'success';
  message: string;
  source: 'frontend' | 'backend';
}

export default function LogsConsole() {
  const [frontendLogs, setFrontendLogs] = useState<LogEntry[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showBackendLogs, setShowBackendLogs] = useState(true);
  const [showFrontendLogs, setShowFrontendLogs] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Obtener logs del backend
  const { data: backendLogsData, isLoading: backendLogsLoading, error: backendLogsError } = useBackendLogs(100);

  // Función para agregar un nuevo log del frontend
  const addFrontendLog = (level: LogEntry['level'], message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      message,
      source: 'frontend'
    };

    setFrontendLogs(prev => [...prev.slice(-99), newLog]); // Mantener solo los últimos 100 logs
  };

  // Combinar logs del frontend y backend
  const getAllLogs = (): LogEntry[] => {
    const combinedLogs: LogEntry[] = [];
    
    // Agregar logs del frontend si están habilitados
    if (showFrontendLogs) {
      combinedLogs.push(...frontendLogs);
    }
    
    // Agregar logs del backend si están habilitados y disponibles
    if (showBackendLogs && backendLogsData?.success) {
      const backendLogs: LogEntry[] = backendLogsData.data.logs.map((log: BackendLogEntry) => ({
        ...log,
        source: 'backend' as const
      }));
      combinedLogs.push(...backendLogs);
    }
    
    // Ordenar por timestamp
    return combinedLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const allLogs = getAllLogs();

  // Interceptar console.log para capturar logs del frontend
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      if (message.includes('🌐') || message.includes('📡') || message.includes('✅') || message.includes('❌')) {
        addFrontendLog('info', message);
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      addFrontendLog('error', message);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      addFrontendLog('warning', message);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Auto-scroll hacia el final cuando se agregan nuevos logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allLogs, autoScroll]);

  // Limpiar logs del frontend
  const clearFrontendLogs = () => {
    setFrontendLogs([]);
  };

  // Formatear timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Obtener clase CSS según el nivel del log con modo oscuro
  const getLogLevelClass = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-l-red-500 dark:border-l-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-l-yellow-500 dark:border-l-yellow-400';
      case 'success':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-l-green-500 dark:border-l-green-400';
      default:
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-blue-500 dark:border-l-blue-400';
    }
  };

  // Obtener icono según la fuente
  const getSourceIcon = (source: LogEntry['source']) => {
    return source === 'backend' ? '🖥️' : '💻';
  };

  if (isCollapsed) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">📋 Logs del Sistema</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
              {allLogs.length} entradas
            </span>
            {backendLogsLoading && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">
                Cargando backend...
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(false)}
            className="px-3 py-1 text-sm bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            Expandir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">📋 Logs del Sistema</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
            {allLogs.length} entradas
          </span>
          {backendLogsLoading && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">
              🔄 Sincronizando...
            </span>
          )}
          {backendLogsError && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
              ❌ Error backend
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showFrontendLogs}
              onChange={(e) => setShowFrontendLogs(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
            />
            <span>💻 Frontend</span>
          </label>
          
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showBackendLogs}
              onChange={(e) => setShowBackendLogs(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 dark:bg-gray-700"
            />
            <span>🖥️ Backend</span>
          </label>
          
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
            />
            <span>Auto-scroll</span>
          </label>
          
          <button
            onClick={clearFrontendLogs}
            className="px-3 py-1 text-sm bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
          >
            Limpiar Frontend
          </button>
          
          <button
            onClick={() => setIsCollapsed(true)}
            className="px-3 py-1 text-sm bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            Contraer
          </button>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto border dark:border-gray-700">
        {allLogs.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-500 text-center py-8">
            📋 No hay logs disponibles. Los logs aparecerán aquí en tiempo real.
          </div>
        ) : (
          <div className="space-y-1">
            {allLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded border-l-4 ${getLogLevelClass(log.level)}`}
              >
                <div className="flex items-start space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal min-w-[80px]">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className="text-xs">
                    {getSourceIcon(log.source)}
                  </span>
                  <span className="flex-1 text-gray-800 dark:text-gray-200">
                    {log.message}
                  </span>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {allLogs.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 Logs se actualizan automáticamente cada 5 segundos. 
          Frontend: {frontendLogs.length} | Backend: {backendLogsData?.data?.logs?.length || 0}
        </div>
      )}
    </div>
  );
} 