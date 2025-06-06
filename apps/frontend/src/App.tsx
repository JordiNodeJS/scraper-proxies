/**
 * Aplicación principal - MVP Proxy Scraper Frontend
 */

import './index.css';
import SystemStatus from './components/SystemStatus';
import ProxyScraper from './components/ProxyScraper';
import LogsConsole from './components/LogsConsole';

/**
 * Componente principal de la aplicación
 */
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔍 Scraper de Proxies
          </h1>
          <p className="text-lg text-gray-600">
            MVP para el scraping y validación de proxies en tiempo real
          </p>
        </header>

        {/* Contenido principal */}
        <main className="max-w-6xl mx-auto space-y-6">
          {/* Estado del sistema */}
          <SystemStatus />
          
          {/* Scraper de proxies */}
          <ProxyScraper />
          
          {/* Console de logs en tiempo real */}
          <LogsConsole />
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>🚀 MVP desarrollado con Bun + React + TypeScript + Tailwind CSS 4</p>
        </footer>
      </div>
    </div>
  );
}

export default App; 