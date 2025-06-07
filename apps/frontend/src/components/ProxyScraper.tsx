import { useState } from 'react';
import { apiService } from '../services/api';
import type { Proxy } from '../types/api.types';
import ProxyTable from './ProxyTable';

export default function ProxyScraper() {
  const [scrapedProxies, setScrapedProxies] = useState<Proxy[]>([]);
  const [scrapingTime, setScrapingTime] = useState<number | null>(null);
  const [lastScrapingResult, setLastScrapingResult] = useState<string | null>(null);
  const [isDirectScraping, setIsDirectScraping] = useState(false);

  const handleDirectScrape = async () => {
    const startTime = Date.now();
    setIsDirectScraping(true);
    setLastScrapingResult(null);
    
    console.log('🌐 Iniciando extracción de PROXIES REALES...');
    setLastScrapingResult('🌐 Extrayendo proxies REALES de la web...');
    
    try {
      const result = await apiService.scrapeDirectProxies();
      const endTime = Date.now();
      
      if (result.success) {
        setScrapedProxies(result.data.proxies);
        setScrapingTime(result.data.scrapingTime || endTime - startTime);
        setLastScrapingResult(`✅ Scraping DIRECTO exitoso: ${result.data.proxies.length} proxies REALES extraídos de ${result.data.source}. Método: ${(result.data as any).method}`);
        console.log(`✅ Scraping DIRECTO exitoso: ${result.data.proxies.length} proxies reales de ${result.data.source}`);
      } else {
        throw new Error((result as any).error || (result as any).details || 'Scraping directo falló');
      }
    } catch (error) {
      console.error('❌ Error durante el scraping DIRECTO:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setLastScrapingResult(`❌ Error en scraping DIRECTO: ${errorMessage}. Los servidores de proxy pueden estar bloqueando el acceso.`);
    } finally {
      setIsDirectScraping(false);
    }
  };

  const exportToJSON = () => {
    if (scrapedProxies.length === 0) {
      alert('No hay proxies para exportar');
      return;
    }

    const dataStr = JSON.stringify(scrapedProxies, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `proxies_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log(`📁 Exportados ${scrapedProxies.length} proxies a JSON`);
  };

  const exportToCSV = () => {
    if (scrapedProxies.length === 0) {
      alert('No hay proxies para exportar');
      return;
    }

    const headers = ['IP', 'Puerto', 'Tipo', 'País', 'Anonimato', 'Velocidad', 'Uptime', 'Última Verificación'];
    const csvContent = [
      headers.join(','),
      ...scrapedProxies.map(proxy => [
        proxy.ip,
        proxy.port,
        proxy.type,
        proxy.country || 'N/A',
        proxy.anonymity || 'N/A',
        proxy.speed || 'N/A',
        proxy.uptime || 'N/A',
        proxy.lastChecked || 'N/A'
      ].join(','))
    ].join('\n');

    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    
    const exportFileDefaultName = `proxies_${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log(`📁 Exportados ${scrapedProxies.length} proxies a CSV`);
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Scraper de Proxies</h2>
        
        <div className="flex space-x-3">
          <button
            onClick={handleDirectScrape}
            disabled={isDirectScraping}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDirectScraping
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg'
            }`}
            title="Extrae proxies reales de múltiples fuentes en tiempo real (RECOMENDADO)"
          >
            {isDirectScraping ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Extrayendo...
              </div>
            ) : (
              <>
                🎯 Proxies Reales
                <span className="ml-2 text-xs font-bold">(FUNCIONAL)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Estado del último scraping */}
      {lastScrapingResult && (
        <div className={`p-3 rounded-lg mb-4 text-sm transition-colors ${
          lastScrapingResult.includes('✅') 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
            : lastScrapingResult.includes('❌')
            ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
        }`}>
          {lastScrapingResult}
        </div>
      )}

      {/* Resultados del scraping - Nueva tabla con paginación */}
      {scrapedProxies.length > 0 && (
        <div className="space-y-4">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Proxies</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{scrapedProxies.length}</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">HTTPS</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {scrapedProxies.filter(p => p.type === 'HTTPS').length}
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">HTTP</div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {scrapedProxies.filter(p => p.type === 'HTTP').length}
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Países</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {new Set(scrapedProxies.map(p => p.country).filter(Boolean)).size}
              </div>
            </div>
          </div>

          {/* Botones de exportación */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={exportToJSON}
              className="px-3 py-1 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              📄 Exportar JSON
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 py-1 text-sm bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              📊 Exportar CSV
            </button>
          </div>

          {/* Tabla de proxies con paginación */}
          <ProxyTable 
            proxies={scrapedProxies}
            scrapingTime={scrapingTime}
          />
        </div>
      )}

      {/* Mensaje cuando no hay proxies */}
      {scrapedProxies.length === 0 && !isDirectScraping && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-medium mb-2">¡Listo para extraer proxies!</h3>
          <p className="text-sm">
            Haz clic en "Proxies Reales" para obtener proxies funcionales de múltiples fuentes.
          </p>
        </div>
      )}
    </div>
  );
} 