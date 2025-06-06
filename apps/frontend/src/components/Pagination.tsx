import type { PaginationConfig, PaginationControls } from '../types/table.types';

interface PaginationProps {
  pagination: PaginationConfig;
  controls: Pick<PaginationControls, 'goToPage' | 'goToFirstPage' | 'goToLastPage' | 'goToNextPage' | 'goToPreviousPage'>;
  showInfo?: boolean;
}

export default function Pagination({ pagination, controls, showInfo = true }: PaginationProps) {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
  const { goToPage, goToFirstPage, goToLastPage, goToNextPage, goToPreviousPage } = controls;

  // Calcular rango de elementos mostrados
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxVisible = 7; // Máximo de números de página visibles

    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Lógica más compleja para muchas páginas
      pageNumbers.push(1);

      if (currentPage > 4) {
        pageNumbers.push('...');
      }

      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (currentPage < totalPages - 3) {
        pageNumbers.push('...');
      }

      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  if (totalPages <= 1) {
    return showInfo ? (
      <div className="flex items-center justify-center py-3">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {totalItems} elemento{totalItems !== 1 ? 's' : ''} total{totalItems !== 1 ? 'es' : ''}
        </span>
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Información de elementos */}
      {showInfo && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando <span className="font-medium text-gray-900 dark:text-gray-100">{startItem}</span> a{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">{endItem}</span> de{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span> resultados
        </div>
      )}

      {/* Controles de paginación */}
      <div className="flex items-center space-x-2">
        {/* Botón Primera página */}
        <button
          onClick={goToFirstPage}
          disabled={currentPage === 1}
          className={`p-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === 1
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Primera página"
        >
          ⏮️
        </button>

        {/* Botón Página anterior */}
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className={`p-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === 1
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Página anterior"
        >
          ⬅️
        </button>

        {/* Números de página */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((pageNum, index) => (
            typeof pageNum === 'number' ? (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`min-w-[40px] h-10 px-3 rounded-md text-sm font-medium transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {pageNum}
              </button>
            ) : (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-2 text-gray-500 dark:text-gray-400"
              >
                {pageNum}
              </span>
            )
          ))}
        </div>

        {/* Botón Página siguiente */}
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === totalPages
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Página siguiente"
        >
          ➡️
        </button>

        {/* Botón Última página */}
        <button
          onClick={goToLastPage}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === totalPages
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Última página"
        >
          ⏭️
        </button>
      </div>
    </div>
  );
} 