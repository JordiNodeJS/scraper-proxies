import { useState } from 'react';
import { useScrapeProxies } from '../hooks/useApi';
import { apiService } from '../services/api';
import type { Proxy } from '../types/api.types';

export default function ProxyScraper() {
  const [scrapedProxies, setScrapedProxies] = useState<Proxy[]>([]);
  const [scrapingTime, setScrapingTime] = useState<number | null>(null);
  const [isRealScraping, setIsRealScraping] = useState(false);
  const [realScrapingError, setRealScrapingError] = useState<string | null>(null);
  const [lastScrapingResult, setLastScrapingResult] = useState<string | null>(null);
  const [isDirectScraping, setIsDirectScraping] = useState(false);
  
  const scrapeMutation = useScrapeProxies();

  const handleScrape = async () => {
    const startTime = Date.now();
    setLastScrapingResult(null);
    console.log('🧪 Iniciando scraping de prueba...');
    
    try {
      const result = await scrapeMutation.mutateAsync(undefined);
      const endTime = Date.now();
      
      if (result.success) {
        setScrapedProxies(result.data.proxies);
        setScrapingTime(endTime - startTime);
        setLastScrapingResult(`✅ Scraping de prueba exitoso: ${result.data.proxies.length} proxies encontrados`);
        console.log(`✅ Scraping de prueba completado: ${result.data.proxies.length} proxies`);
      }
    } catch (error) {
      console.error('❌ Error durante el scraping de prueba:', error);
      setLastScrapingResult(`❌ Error en scraping de prueba: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleRealScrape = async () => {
    const startTime = Date.now();
    setIsRealScraping(true);
    setRealScrapingError(null);
    setLastScrapingResult(null);
    
    console.log('🌐 Iniciando scraping REAL de proxies...');
    setLastScrapingResult('🌐 Conectando con el backend para scraping real...');
    
    try {
      const result = await apiService.scrapeRealProxies();
      const endTime = Date.now();
      
      if (result.success) {
        // Scraping exitoso
        setScrapedProxies(result.data.proxies);
        setScrapingTime(result.data.scrapingTime || endTime - startTime);
        setLastScrapingResult(`✅ Scraping REAL exitoso: ${result.data.proxies.length} proxies reales obtenidos de ${result.data.source || 'fuente desconocida'}`);
        console.log(`✅ Scraping REAL exitoso: ${result.data.proxies.length} proxies de ${result.data.source || 'fuente desconocida'}`);
      } else {
        // Scraping falló pero puede tener datos de fallback
        const errorResult = result as any;
        
        if (errorResult.fallbackData && errorResult.fallbackData.proxies) {
          // Usar datos de fallback
          setScrapedProxies(errorResult.fallbackData.proxies);
          setScrapingTime(errorResult.fallbackData.scrapingTime || endTime - startTime);
          setLastScrapingResult(`⚠️ Scraping REAL falló, mostrando datos de fallback: ${errorResult.fallbackData.proxies.length} proxies. Error: ${errorResult.details || errorResult.error}`);
          console.warn(`⚠️ Usando datos de fallback: ${errorResult.fallbackData.proxies.length} proxies`);
        } else {
          throw new Error(errorResult.error || errorResult.details || 'Scraping falló en el servidor');
        }
      }
    } catch (error) {
      console.error('❌ Error durante el scraping REAL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setRealScrapingError(errorMessage);
      setLastScrapingResult(`❌ Error en scraping REAL: ${errorMessage}. Usa "Test Scraping" para datos simulados.`);
    } finally {
      setIsRealScraping(false);
    }
  };

  const handleDirectScrape = async () => {
    const startTime = Date.now();
    setIsDirectScraping(true);
    setRealScrapingError(null);
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
      setRealScrapingError(errorMessage);
      setLastScrapingResult(`❌ Error en scraping DIRECTO: ${errorMessage}. Los servidores de proxy pueden estar bloqueando el acceso.`);
    } finally {
      setIsDirectScraping(false);
    }
  };

  const exportToJson = () => {
    console.log('📄 Exportando proxies a JSON...');
    const dataStr = JSON.stringify(scrapedProxies, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `proxies_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log(`✅ Archivo JSON exportado: ${scrapedProxies.length} proxies`);
  };

  const exportToCsv = () => {
    console.log('📊 Exportando proxies a CSV...');
    const headers = ['IP', 'Puerto', 'Tipo', 'País'];
    const csvContent = [
      headers.join(','),
      ...scrapedProxies.map(proxy => 
        [proxy.ip, proxy.port, proxy.type, proxy.country || 'N/A'].join(',')
      )
    ].join('\n');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `proxies_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log(`✅ Archivo CSV exportado: ${scrapedProxies.length} proxies`);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Scraper de Proxies</h2>
        
        <div className="flex space-x-3">
          <button
            onClick={handleScrape}
            disabled={true}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-300 text-gray-600 cursor-not-allowed"
            title="Función deshabilitada - Usa 'Proxies Reales' para obtener datos reales"
          >
            🧪 Test Scraping
            <span className="ml-2 text-xs">(Deshabilitado)</span>
          </button>

          <button
            onClick={handleRealScrape}
            disabled={true}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-300 text-gray-600 cursor-not-allowed"
            title="Función deshabilitada - Playwright presenta problemas de timeout. Usa 'Proxies Reales'"
          >
            🌐 Scraping Real
            <span className="ml-2 text-xs">(Deshabilitado)</span>
          </button>

          <button
            onClick={handleDirectScrape}
            disabled={scrapeMutation.isPending || isRealScraping || isDirectScraping}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              scrapeMutation.isPending || isRealScraping || isDirectScraping
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
        <div className={`p-3 rounded-lg mb-4 text-sm ${
          lastScrapingResult.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : lastScrapingResult.includes('❌')
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {lastScrapingResult}
        </div>
      )}

      {/* Resultados del scraping */}
      {scrapedProxies.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-medium text-gray-900">
                {scrapedProxies.length} proxies encontrados
              </span>
              {scrapingTime && (
                <span className="text-sm text-gray-600">
                  en {(scrapingTime / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={exportToJson}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                📄 JSON
              </button>
              <button
                onClick={exportToCsv}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                📊 CSV
              </button>
            </div>
          </div>

          {/* Tabla de proxies */}
          <div className="overflow-x-auto bg-gray-50 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">IP</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Puerto</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">País</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Anonimato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scrapedProxies.map((proxy) => (
                  <tr key={`${proxy.ip}:${proxy.port}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-900">{proxy.ip}</td>
                    <td className="px-4 py-3 text-gray-900">{proxy.port}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        proxy.type === 'HTTPS' ? 'bg-green-100 text-green-800' :
                        proxy.type === 'HTTP' ? 'bg-blue-100 text-blue-800' :
                        proxy.type === 'SOCKS5' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {proxy.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{proxy.country || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {proxy.anonymity ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          proxy.anonymity === 'elite' ? 'bg-purple-100 text-purple-800' :
                          proxy.anonymity === 'anonymous' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {proxy.anonymity}
                        </span>
                      ) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {(scrapeMutation.isError || realScrapingError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-red-800 font-medium">Error durante el scraping</p>
          <p className="text-red-600 text-sm mt-1">
            {realScrapingError || scrapeMutation.error?.message || 'Error desconocido'}
          </p>
          {realScrapingError && (
            <div className="mt-2 space-y-1">
              <p className="text-red-500 text-xs">
                💡 Tip: Puedes usar "Test Scraping" para datos simulados
              </p>
              <p className="text-red-500 text-xs">
                🔧 Verifica que el backend esté ejecutándose en el puerto 3001
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mensaje informativo si no hay proxies */}
      {scrapedProxies.length === 0 && !scrapeMutation.isPending && !scrapeMutation.isError && !isRealScraping && !isDirectScraping && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
              🎯
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Extracción de Proxies REALES</h3>
              <p className="text-gray-600">Sistema optimizado y confiable para obtener proxies funcionales</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                ✓
              </div>
              <div>
                <strong className="text-green-800">🎯 Proxies Reales:</strong>
                <span className="text-gray-700 ml-2">Extracción directa y rápida de múltiples fuentes (Free Proxy List, GitHub SpeedX, PubProxy) - ¡27 proxies en menos de 1 segundo!</span>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                ✗
              </div>
              <div>
                <strong className="text-gray-600">🧪 Test Scraping:</strong>
                <span className="text-gray-500 ml-2">Deshabilitado - Solo mostraba datos simulados</span>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                ✗
              </div>
              <div>
                <strong className="text-gray-600">🌐 Scraping Real:</strong>
                <span className="text-gray-500 ml-2">Deshabilitado - Playwright presenta timeouts constantes en este entorno</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 