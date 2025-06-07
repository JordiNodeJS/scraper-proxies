/**
 * Aplicación principal - MVP Proxy Scraper Frontend
 */

import "./index.css";
import { useEffect } from "react";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import SystemStatus from "./components/SystemStatus";
import ProxyScraper from "./components/ProxyScraper";
import LogsConsole from "./components/LogsConsole";
import DarkModeToggle from "./components/DarkModeToggle";
import SSEConnectionIndicator from "./components/SSEConnectionIndicator";
import { useServerEvents } from "./hooks/useServerEvents";
import { printAppConfig } from "./config/app.config";

/**
 * Componente principal de la aplicación
 */
function App() {
  // Imprimir configuración en desarrollo
  printAppConfig();

  // Initialize SSE connection (sin parámetros - usa configuración automática)
  const { connectionState, isConnected, retryCount } = useServerEvents(
    {
      autoConnect: true,
    },
    {
      onLog: (event) => {
        console.log("📋 [SSE] New log:", event.message);
      },
      onScrapingProgress: (event) => {
        console.log("🔄 [SSE] Scraping progress:", event.progress + "%");
      },
      onConnectionChange: (state) => {
        console.log("📡 [SSE] Connection state changed:", state);
      },
    }
  );
  // Título dinámico basado en el estado de conexión SSE
  useEffect(() => {
    const baseTitle = "🌐 Scraper Proxies - MVP";

    if (connectionState === "connecting") {
      document.title = `🔄 Conectando... | ${baseTitle}`;
    } else if (connectionState === "connected") {
      document.title = `🟢 En Línea | ${baseTitle}`;
    } else if (connectionState === "error") {
      document.title = `🔴 Desconectado | ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [connectionState]);

  return (
    <DarkModeProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-8">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <SSEConnectionIndicator
                  connectionState={connectionState}
                  retryCount={retryCount}
                  showDetails={true}
                  className="justify-start"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  🔍 Scraper de Proxies
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  MVP para el scraping y validación de proxies en tiempo real
                </p>
                {isConnected && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    ✨ Eventos en tiempo real activos
                  </p>
                )}
              </div>
              <div className="flex-1 flex justify-end">
                <DarkModeToggle />
              </div>
            </div>
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
          <footer className="text-center mt-12 text-gray-500 dark:text-gray-400 text-sm">
            <p>
              🚀 MVP desarrollado con Bun + React + TypeScript + Tailwind CSS 4
            </p>
          </footer>
        </div>
      </div>
    </DarkModeProvider>
  );
}

export default App;
