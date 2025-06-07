import { useSystemStatus } from '../hooks/useApi';

export default function SystemStatus() {
  const { serverHealth, healthData, testData, refetchTest } = useSystemStatus();

  if (serverHealth.isLoading) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 transition-colors duration-300">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3"></div>
          <span className="text-yellow-800 dark:text-yellow-200 font-medium">Verificando estado del sistema...</span>
        </div>
      </div>
    );
  }



  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 shadow-sm transition-colors duration-300">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Estado del Sistema</h2>
      
      {/* Estado general del servidor */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Estado General</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {serverHealth.message}
            </p>
            {serverHealth.responseTime && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Tiempo de respuesta: {serverHealth.responseTime}ms
              </p>
            )}
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              serverHealth.status === 'healthy' 
                ? 'bg-green-500 animate-pulse' 
                : serverHealth.status === 'degraded'
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              serverHealth.status === 'healthy' 
                ? 'text-green-600 dark:text-green-400' 
                : serverHealth.status === 'degraded'
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {serverHealth.status === 'healthy' ? 'Operativo' : 
               serverHealth.status === 'degraded' ? 'Degradado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado del Backend */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Backend</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {healthData?.runtime} - v{healthData?.version}
            </p>
            {serverHealth.details.healthCheck?.error && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {serverHealth.details.healthCheck.error}
              </p>
            )}
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              serverHealth.details.healthCheck?.success ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              serverHealth.details.healthCheck?.success 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {serverHealth.details.healthCheck?.success ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Estado de la API */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">API</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {testData?.server || 'Test de conectividad'}
            </p>
            {serverHealth.details.apiTest?.error && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {serverHealth.details.apiTest.error}
              </p>
            )}
          </div>
          <div className="flex items-center">
            {serverHealth.details.apiTest?.success ? (
              <>
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse mr-2"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Funcional</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                <button
                  onClick={() => refetchTest()}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Probar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div>
          {serverHealth.lastCheck && (
            <span>Última verificación: {new Date(serverHealth.lastCheck).toLocaleTimeString('es-ES')}</span>
          )}
        </div>
        <button
          onClick={() => serverHealth.refetch()}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          🔄 Verificar ahora
        </button>
      </div>

      {/* Mensaje de estado */}
      {serverHealth.status === 'healthy' && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✅ Sistema completamente operativo y listo para el scraping de proxies
          </p>
        </div>
      )}

      {serverHealth.status === 'degraded' && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Sistema parcialmente operativo. Algunas funciones pueden estar limitadas.
          </p>
        </div>
      )}

      {serverHealth.status === 'down' && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            ❌ Backend no disponible. Verifica que el servidor esté ejecutándose en el puerto 3001.
          </p>
        </div>
      )}
    </div>
  );
} 