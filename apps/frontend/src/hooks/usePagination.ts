import { useState, useMemo, useCallback } from 'react';
import type { 
  PaginationConfig, 
  PaginationControls, 
  TableFiltersConfig, 
  TableState, 
  SortConfig, 
  SortDirection 
} from '../types/table.types';

interface UsePaginationOptions {
  initialItemsPerPage?: number;
  itemsPerPageOptions?: number[];
}

export function usePagination<T>(
  data: T[], 
  options: UsePaginationOptions = {}
): TableState<T> & PaginationControls {
  const {
    initialItemsPerPage = 10,
    itemsPerPageOptions = [5, 10, 20, 50]
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

  // Calcular datos filtrados y ordenados
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Aplicar ordenamiento si está configurado
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key!];
        const bValue = (b as any)[sortConfig.key!];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, sortConfig]);

  // Calcular paginación
  const pagination: PaginationConfig = useMemo(() => {
    const totalItems = filteredAndSortedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages
    };
  }, [filteredAndSortedData.length, itemsPerPage, currentPage]);

  // Calcular datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  // Configuración de filtros
  const filters: TableFiltersConfig = useMemo(() => ({
    itemsPerPageOptions,
    selectedItemsPerPage: itemsPerPage,
    onItemsPerPageChange: (items: number) => {
      setItemsPerPage(items);
      setCurrentPage(1); // Resetear a la primera página
    }
  }), [itemsPerPageOptions, itemsPerPage]);

  // Funciones de control de paginación
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, pagination.totalPages));
    setCurrentPage(validPage);
  }, [pagination.totalPages]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(pagination.totalPages);
  }, [pagination.totalPages]);

  const goToNextPage = useCallback(() => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, pagination.totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const setItemsPerPageCallback = useCallback((items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  }, []);

  // Función para manejar ordenamiento
  const handleSort = useCallback((key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // Si es la misma columna, ciclar: asc -> desc -> null
        const newDirection: SortDirection = 
          prevConfig.direction === 'asc' ? 'desc' :
          prevConfig.direction === 'desc' ? null : 'asc';
        
        return { key: newDirection ? key : null, direction: newDirection };
      } else {
        // Nueva columna, empezar con asc
        return { key, direction: 'asc' };
      }
    });
    setCurrentPage(1); // Resetear a la primera página
  }, []);

  return {
    data,
    filteredData: filteredAndSortedData,
    paginatedData,
    pagination,
    sorting: sortConfig,
    filters,
    // Controles de paginación
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    setItemsPerPage: setItemsPerPageCallback,
    // Función adicional para ordenamiento
    handleSort
  } as TableState<T> & PaginationControls & { handleSort: (key: string) => void };
} 