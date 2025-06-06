/**
 * Página principal Dashboard - MVP Proxy Scraper
 */

import React, { memo, useEffect } from 'react';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import useProxyStore from '../store/proxyStore';

/**
 * Dashboard principal con funcionalidad de scraping
 */
const Dashboard: React.FC = memo(() => {
  const {
    currentSession,
    isLoading,
    error,
    proxies,
    filteredProxies,
    startScraping,
    stopScraping,
    clearError,
  } = useProxyStore();

  const isSessionActive = currentSession?.status === 'scraping' || currentSession?.status === 'validating';
  const isCompleted = currentSession?.status === 'completed';
  const hasProxies = proxies.length > 0;

  // Efecto para limpiar errores después de un tiempo
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleStartScraping = async () => {
    try {
      await startScraping({
        validateProxies: true,
        protocols: ['http', 'https'],
      });
    } catch (err) {
      console.error('Error starting scraping:', err);
    }
  };

  const handleStopScraping = () => {
    stopScraping();
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const getLastExtractionText = () => {
    if (!currentSession) return 'Nunca';
    if (isCompleted && currentSession.endTime) {
      return formatTimestamp(currentSession.endTime);
    }
    return formatTimestamp(currentSession.startTime);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎯 Proxy Scraper
          </h1>
          <p className="text-lg text-gray-600">
            Extracción y validación automática de proxies
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 mb-6">
          {/* Status Section */}
          <div className="text-center mb-8">
            <div className="mb-6">
              {!isSessionActive ? (
                <Button
                  size="lg"
                  onClick={handleStartScraping}
                  loading={isLoading}
                  className="text-xl px-8 py-4"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                >
                  INICIAR SCRAPING
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleStopScraping}
                  className="text-xl px-8 py-4"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  }
                >
                  DETENER SCRAPING
                </Button>
              )}
            </div>

            {/* Status Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    isSessionActive ? 'bg-primary-600 animate-pulse' : 
                    isCompleted ? 'bg-success-600' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-700">Estado:</span>
                </div>
                <span className="text-lg font-bold">
                  {isSessionActive ? 'Activo' : isCompleted ? 'Completado' : 'Inactivo'}
                </span>
              </div>

              <div className="text-center">
                <div className="text-sm font-medium text-gray-700 mb-2">Proxies Disponibles:</div>
                <span className="text-2xl font-bold text-primary-600">{proxies.length}</span>
              </div>

              <div className="text-center">
                <div className="text-sm font-medium text-gray-700 mb-2">Última Extracción:</div>
                <span className="text-sm">{getLastExtractionText()}</span>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          {currentSession && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Progreso del Scraping
              </h3>
              
              <ProgressBar
                progress={currentSession.progress}
                label={currentSession.currentPhase}
                size="lg"
                animated={isSessionActive}
                color={isCompleted ? 'success' : 'primary'}
                className="mb-4"
              />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Fase actual:</span>
                  <span className="ml-2 font-medium">{currentSession.currentPhase}</span>
                </div>
                <div>
                  <span className="text-gray-600">Proxies encontrados:</span>
                  <span className="ml-2 font-medium text-primary-600">{currentSession.proxiesFound}</span>
                </div>
              </div>

              {/* Session Logs */}
              {currentSession.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Mensajes:</h4>
                  <div className="bg-white rounded border p-3 max-h-32 overflow-y-auto">
                    {currentSession.errors.map((error, index) => (
                      <div key={index} className="text-xs text-gray-600 mb-1">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-md p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-error-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-error-800">Error</h3>
                  <p className="text-sm text-error-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              disabled={!hasProxies}
              className="flex-1 sm:flex-none"
            >
              📊 Ver Resultados ({filteredProxies.length})
            </Button>
            
            <Button
              variant="secondary"
              disabled={!hasProxies}
              className="flex-1 sm:flex-none"
            >
              🌐 Navegar Web
            </Button>
            
            <Button
              variant="secondary"
              disabled={!hasProxies}
              className="flex-1 sm:flex-none"
            >
              ⚙️ Configuración
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {hasProxies && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas Rápidas</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {proxies.filter(p => p.protocol === 'https').length}
                </div>
                <div className="text-sm text-gray-600">HTTPS</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">
                  {proxies.filter(p => p.protocol === 'http').length}
                </div>
                <div className="text-sm text-gray-600">HTTP</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-600">
                  {proxies.filter(p => p.isWorking === true).length}
                </div>
                <div className="text-sm text-gray-600">Funcionando</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {new Set(proxies.map(p => p.country)).size}
                </div>
                <div className="text-sm text-gray-600">Países</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard; 