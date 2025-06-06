import { useSystemStatus } from '../hooks/useApi';

export default function SystemStatus() {
  const { isHealthy, isConnected, isLoading, healthData, testData, refetchTest } = useSystemStatus();

  if (isLoading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3"></div>
          <span className="text-yellow-800 font-medium">Verificando estado del sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado del Backend */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Backend</h3>
            <p className="text-sm text-gray-600">
              {healthData?.runtime} - v{healthData?.version}
            </p>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              isHealthy ? 'text-green-600' : 'text-red-600'
            }`}>
              {isHealthy ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Estado de la API */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">API</h3>
            <p className="text-sm text-gray-600">
              {testData?.server || 'Test de conectividad'}
            </p>
          </div>
          <div className="flex items-center">
            {isConnected ? (
              <>
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse mr-2"></div>
                <span className="text-sm font-medium text-green-600">Funcional</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                <button
                  onClick={() => refetchTest()}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Probar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      {isHealthy && isConnected && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✅ Sistema completamente operativo y listo para el scraping de proxies
          </p>
        </div>
      )}

      {isHealthy && !isConnected && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Backend conectado pero API no probada. Haz clic en "Probar" para verificar.
          </p>
        </div>
      )}

      {!isHealthy && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ❌ Backend no disponible. Verifica que el servidor esté ejecutándose en el puerto 3001.
          </p>
        </div>
      )}
    </div>
  );
} 