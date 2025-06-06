import { useState } from 'react';
import { useScrapeProxies } from '../hooks/useApi';
import type { Proxy } from '../types/api.types';

export default function ProxyScraper() {
  const [scrapedProxies, setScrapedProxies] = useState<Proxy[]>([]);
  const [scrapingTime, setScrapingTime] = useState<number | null>(null);
  
  const scrapeMutation = useScrapeProxies();

  const handleScrape = async () => {
    const startTime = Date.now();
    
    try {
      const result = await scrapeMutation.mutateAsync();
      const endTime = Date.now();
      
      if (result.success) {
        setScrapedProxies(result.data.proxies);
        setScrapingTime(endTime - startTime);
      }
    } catch (error) {
      console.error('Error durante el scraping:', error);
    }
  };

  const exportToJson = () => {
    const dataStr = JSON.stringify(scrapedProxies, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `proxies_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const exportToCsv = () => {
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
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Scraper de Proxies</h2>
        
        <button
          onClick={handleScrape}
          disabled={scrapeMutation.isPending}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            scrapeMutation.isPending
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {scrapeMutation.isPending ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Scrapeando...
            </div>
          ) : (
            '🚀 Iniciar Scraping'
          )}
        </button>
      </div>

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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scrapedProxies.map((proxy, index) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {scrapeMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Error durante el scraping</p>
          <p className="text-red-600 text-sm mt-1">
            {scrapeMutation.error?.message || 'Error desconocido'}
          </p>
        </div>
      )}

      {/* Mensaje informativo si no hay proxies */}
      {scrapedProxies.length === 0 && !scrapeMutation.isPending && !scrapeMutation.isError && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Listo para scraping
          </h3>
          <p className="text-gray-600">
            Haz clic en "Iniciar Scraping" para buscar proxies disponibles
          </p>
        </div>
      )}
    </div>
  );
} 