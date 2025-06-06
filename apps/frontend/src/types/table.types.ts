export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationControls {
  goToPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setItemsPerPage: (items: number) => void;
}

export interface TableFiltersConfig {
  itemsPerPageOptions: number[];
  selectedItemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationConfig;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string | null;
  direction: SortDirection;
}

export interface TableState<T> {
  data: T[];
  filteredData: T[];
  paginatedData: T[];
  pagination: PaginationConfig;
  sorting: SortConfig;
  filters: TableFiltersConfig;
} 