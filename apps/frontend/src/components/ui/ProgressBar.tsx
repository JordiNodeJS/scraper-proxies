/**
 * Componente ProgressBar para mostrar progreso visual
 */

import React, { memo } from 'react';

interface ProgressBarProps {
  /**
   * Porcentaje de progreso (0-100)
   */
  progress: number;
  
  /**
   * Texto descriptivo del progreso actual
   */
  label?: string;
  
  /**
   * Mostrar el porcentaje como texto
   */
  showPercentage?: boolean;
  
  /**
   * Tamaño de la barra
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Color de la barra
   */
  color?: 'primary' | 'success' | 'warning' | 'error';
  
  /**
   * Animación pulsante cuando está en progreso
   */
  animated?: boolean;
  
  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * Componente ProgressBar con animaciones y múltiples variantes
 *
 * @param props - Las props del componente
 * @returns JSX.Element
 */
const ProgressBar: React.FC<ProgressBarProps> = memo(({
  progress,
  label,
  showPercentage = true,
  size = 'md',
  color = 'primary',
  animated = true,
  className = '',
}) => {
  // Asegurar que el progreso esté entre 0 y 100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };
  
  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600',
  };
  
  const isComplete = clampedProgress >= 100;
  const isInProgress = clampedProgress > 0 && clampedProgress < 100;
  
  return (
    <div className={`w-full ${className}`}>
      {/* Header con label y porcentaje */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-500">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      
      {/* Barra de progreso */}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]} overflow-hidden`}>
        <div
          className={`
            ${sizeClasses[size]}
            ${colorClasses[color]}
            transition-all duration-300 ease-out
            ${animated && isInProgress ? 'animate-pulse-fast' : ''}
            ${isComplete ? 'animate-none' : ''}
          `}
          style={{ width: `${clampedProgress}%` }}
        >
          {/* Brillo animado para efecto visual */}
          {animated && isInProgress && (
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white via-transparent to-transparent opacity-30 animate-pulse" />
          )}
        </div>
      </div>
      
      {/* Indicador de estado */}
      <div className="flex items-center mt-2 text-xs text-gray-500">
        {isComplete && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-success-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Completado</span>
          </div>
        )}
        
        {isInProgress && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-primary-600 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>En progreso...</span>
          </div>
        )}
        
        {clampedProgress === 0 && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Preparado</span>
          </div>
        )}
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar; 