import type { TableFiltersConfig } from '../types/table.types';

interface TableFiltersProps {
  filters: TableFiltersConfig;
  totalItems: number;
  className?: string;
}

export default function TableFilters({ filters, totalItems, className = '' }: TableFiltersProps) {
  const { itemsPerPageOptions, selectedItemsPerPage, onItemsPerPageChange } = filters;

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Selector de elementos por página */}
      <div className="flex items-center space-x-2">
        <label 
          htmlFor="items-per-page"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Mostrar:
        </label>
        <select
          id="items-per-page"
          value={selectedItemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="block w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 
                     rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400
                     transition-colors"
        >
          {itemsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          por página
        </span>
      </div>

      {/* Información adicional */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {totalItems} total
      </div>
    </div>
  );
} 