/**
 * Componente Button reutilizable con múltiples variantes y estados
 */

import React, { memo } from 'react';

interface ButtonProps {
  /**
   * Contenido del botón
   */
  children: React.ReactNode;
  
  /**
   * Variante visual del botón
   */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  
  /**
   * Tamaño del botón
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Estado del botón
   */
  loading?: boolean;
  disabled?: boolean;
  
  /**
   * Función a ejecutar al hacer clic
   */
  onClick?: () => void;
  
  /**
   * Clases CSS adicionales
   */
  className?: string;
  
  /**
   * Tipo de botón HTML
   */
  type?: 'button' | 'submit' | 'reset';
  
  /**
   * Icono opcional (componente React)
   */
  icon?: React.ReactNode;
  
  /**
   * Posición del icono
   */
  iconPosition?: 'left' | 'right';
}

/**
 * Componente Button con múltiples variantes, estados y soporte para iconos
 *
 * @param props - Las props del componente
 * @returns JSX.Element
 */
const Button: React.FC<ButtonProps> = memo(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  icon,
  iconPosition = 'left',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 focus:ring-gray-500 text-gray-800',
    success: 'bg-success-600 hover:bg-success-700 focus:ring-success-500 text-white',
    danger: 'bg-error-600 hover:bg-error-700 focus:ring-error-500 text-white',
    warning: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500 text-white',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const isDisabled = disabled || loading;
  
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };
  
  const LoadingSpinner = () => (
    <svg 
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
  
  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && <LoadingSpinner />}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button; 