import React from 'react';
import type { SSEConnectionState } from '../types/events.types';

interface SSEConnectionIndicatorProps {
  connectionState: SSEConnectionState;
  retryCount?: number;
  className?: string;
  showDetails?: boolean;
}

const SSEConnectionIndicator: React.FC<SSEConnectionIndicatorProps> = ({
  connectionState,
  retryCount = 0,
  className = '',
  showDetails = false
}) => {
  const getStatusConfig = (state: SSEConnectionState) => {
    switch (state) {
      case 'connected':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-300 dark:border-green-700',
          icon: '🟢',
          text: 'Conectado',
          description: 'Eventos en tiempo real activos'
        };
      case 'connecting':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-300 dark:border-yellow-700',
          icon: '🟡',
          text: 'Conectando...',
          description: 'Estableciendo conexión SSE'
        };
      case 'reconnecting':
        return {
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          borderColor: 'border-orange-300 dark:border-orange-700',
          icon: '🔄',
          text: `Reconectando... (${retryCount})`,
          description: 'Intentando restablecer conexión'
        };
      case 'error':
        return {
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          borderColor: 'border-red-300 dark:border-red-700',
          icon: '🔴',
          text: 'Error de conexión',
          description: 'No se puede conectar al servidor'
        };
      case 'disconnected':
      default:
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          borderColor: 'border-gray-300 dark:border-gray-700',
          icon: '⚫',
          text: 'Desconectado',
          description: 'Sin conexión en tiempo real'
        };
    }
  };

  const config = getStatusConfig(connectionState);

  if (!showDetails) {
    // Compact version - just an icon with tooltip
    return (
      <div 
        className={`inline-flex items-center ${className}`}
        title={`SSE: ${config.text} - ${config.description}`}
      >
        <span className="text-sm">{config.icon}</span>
      </div>
    );
  }

  // Full version with details
  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div 
        className={`
          flex items-center space-x-2 px-3 py-1.5 rounded-lg border
          ${config.bgColor} ${config.borderColor} ${config.color}
          transition-all duration-300
        `}
      >
        <span className="text-sm">{config.icon}</span>
        <div className="flex flex-col">
          <span className="text-xs font-medium">{config.text}</span>
          {showDetails && (
            <span className="text-xs opacity-75">{config.description}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SSEConnectionIndicator; 