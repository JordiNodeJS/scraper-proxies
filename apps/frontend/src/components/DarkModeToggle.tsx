import { useDarkMode } from '../contexts/DarkModeContext';

interface DarkModeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function DarkModeToggle({ className = '', showLabel = true }: DarkModeToggleProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDarkMode ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
        </span>
      )}
      
      <button
        onClick={toggleDarkMode}
        className="relative inline-flex h-6 w-11 items-center rounded-full 
                   bg-gray-200 dark:bg-gray-700 transition-colors duration-200 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   dark:focus:ring-offset-gray-800"
        role="switch"
        aria-checked={isDarkMode}
        aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white 
                     shadow-lg transition-transform duration-200 ease-in-out
                     ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs">
            {isDarkMode ? '🌙' : '☀️'}
          </span>
        </span>
      </button>
    </div>
  );
} 