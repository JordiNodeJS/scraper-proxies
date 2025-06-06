import type { Proxy } from '../types/api.types';
import { usePagination } from '../hooks/usePagination';
import Pagination from './Pagination';
import TableFilters from './TableFilters';

interface ProxyTableProps {
  proxies: Proxy[];
  scrapingTime?: number | null;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export default function ProxyTable({ proxies, scrapingTime, onExportJson, onExportCsv }: ProxyTableProps) {
  const tableState = usePagination(proxies, {
    initialItemsPerPage: 10,
    itemsPerPageOptions: [5, 10, 20, 50]
  });

  const {
    paginatedData,
    pagination,
    filters,
    sorting,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage
  } = tableState;

  const handleSort = (tableState as any).handleSort;

  // Función para renderizar iconos de ordenamiento
  const renderSortIcon = (columnKey: string) => {
    if (sorting.key !== columnKey) {
      return <span className="text-gray-400">↕️</span>;
    }
    return sorting.direction === 'asc' ? '⬆️' : '⬇️';
  };

  // Función para formatear tiempo de respuesta
  const formatSpeed = (speed?: number) => {
    if (!speed) return 'N/A';
    if (speed < 1000) return `${speed}ms`;
    return `${(speed / 1000).toFixed(1)}s`;
  };

  // Función para formatear uptime
  const formatUptime = (uptime?: number) => {
    if (!uptime) return 'N/A';
    return `${uptime.toFixed(1)}%`;
  };

  // Función para formatear fecha
  const formatLastChecked = (lastChecked?: string) => {
    if (!lastChecked) return 'N/A';
    const date = new Date(lastChecked);
    return date.toLocaleString('es-ES', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (proxies.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Header con información y controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-4">
          <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {proxies.length} proxies encontrados
          </span>
          {scrapingTime && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              en {(scrapingTime / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        
        {/* Controles de exportación */}
        <div className="flex space-x-2">
          <button
            onClick={onExportJson}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            📄 JSON
          </button>
          <button
            onClick={onExportCsv}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            📊 CSV
          </button>
        </div>
      </div>

      {/* Filtros de tabla */}
      <div className="mb-4">
        <TableFilters 
          filters={filters} 
          totalItems={proxies.length}
          className="justify-start"
        />
      </div>

      {/* Tabla de proxies */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th 
                className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('ip')}
              >
                <div className="flex items-center space-x-1">
                  <span>IP</span>
                  {renderSortIcon('ip')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('port')}
              >
                <div className="flex items-center space-x-1">
                  <span>Puerto</span>
                  {renderSortIcon('port')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center space-x-1">
                  <span>Tipo</span>
                  {renderSortIcon('type')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('country')}
              >
                <div className="flex items-center space-x-1">
                  <span>País</span>
                  {renderSortIcon('country')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('anonymity')}
              >
                <div className="flex items-center space-x-1">
                  <span>Anonimato</span>
                  {renderSortIcon('anonymity')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('speed')}
              >
                <div className="flex items-center space-x-1">
                  <span>Velocidad</span>
                  {renderSortIcon('speed')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('uptime')}
              >
                <div className="flex items-center space-x-1">
                  <span>Uptime</span>
                  {renderSortIcon('uptime')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('lastChecked')}
              >
                <div className="flex items-center space-x-1">
                  <span>Última Verificación</span>
                  {renderSortIcon('lastChecked')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((proxy) => (
              <tr 
                key={`${proxy.ip}:${proxy.port}`} 
                className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">
                  {proxy.ip}
                </td>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                  {proxy.port}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                    proxy.type === 'HTTPS' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    proxy.type === 'HTTP' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                    proxy.type === 'SOCKS5' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                    proxy.type === 'SOCKS4' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {proxy.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                  {proxy.country || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  {proxy.anonymity ? (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      proxy.anonymity === 'elite' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                      proxy.anonymity === 'anonymous' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {proxy.anonymity}
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-sm ${
                    proxy.speed && proxy.speed < 1000 ? 'text-green-600 dark:text-green-400' :
                    proxy.speed && proxy.speed < 3000 ? 'text-yellow-600 dark:text-yellow-400' :
                    proxy.speed ? 'text-red-600 dark:text-red-400' :
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formatSpeed(proxy.speed)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-sm ${
                    proxy.uptime && proxy.uptime >= 90 ? 'text-green-600 dark:text-green-400' :
                    proxy.uptime && proxy.uptime >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                    proxy.uptime ? 'text-red-600 dark:text-red-400' :
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formatUptime(proxy.uptime)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {formatLastChecked(proxy.lastChecked)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <Pagination
        pagination={pagination}
        controls={{
          goToPage,
          goToFirstPage,
          goToLastPage,
          goToNextPage,
          goToPreviousPage
        }}
        showInfo={true}
      />
    </div>
  );
} 