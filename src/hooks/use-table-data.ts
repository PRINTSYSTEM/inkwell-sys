import { useState, useEffect, useCallback, useMemo } from 'react';

export interface TableState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  filters: Record<string, unknown>;
}

export interface TableActions<T> {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (field: string, order?: 'asc' | 'desc') => void;
  setSearch: (query: string) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  refresh: () => void;
  reset: () => void;
  updateItem: (id: string | number, updates: Partial<T>) => void;
  removeItem: (id: string | number) => void;
  addItem: (item: T) => void;
}

export interface UseTableDataOptions<T> {
  // Data source
  loadData: (params: {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, unknown>;
  }) => Promise<{
    data: T[];
    totalItems: number;
  }>;

  // Initial state
  initialPageSize?: number;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  initialFilters?: Record<string, unknown>;

  // Behavior options
  autoLoad?: boolean;
  debounceMs?: number;
  cacheKey?: string;
  
  // Item identification
  idField?: keyof T;
}

export function useTableData<T extends Record<string, unknown>>(
  options: UseTableDataOptions<T>
): [TableState<T>, TableActions<T>] {
  const {
    loadData,
    initialPageSize = 10,
    initialSortBy,
    initialSortOrder = 'asc',
    initialFilters = {},
    autoLoad = true,
    debounceMs = 300,
    cacheKey,
    idField = 'id' as keyof T
  } = options;

  // State
  const [state, setState] = useState<TableState<T>>({
    data: [],
    loading: false,
    error: null,
    totalItems: 0,
    currentPage: 1,
    pageSize: initialPageSize,
    sortBy: initialSortBy || null,
    sortOrder: initialSortOrder,
    searchQuery: '',
    filters: initialFilters
  });

  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(state.searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [state.searchQuery, debounceMs]);

  // Load data function
  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await loadData({
        page: state.currentPage,
        pageSize: state.pageSize,
        sortBy: state.sortBy || undefined,
        sortOrder: state.sortOrder,
        search: typeof debouncedSearchQuery === 'string' ? debouncedSearchQuery : '',
        filters: Object.keys(state.filters).length > 0 ? state.filters : undefined
      });

      setState(prev => ({
        ...prev,
        data: result.data,
        totalItems: result.totalItems,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu',
        loading: false
      }));
    }
  }, [
    loadData,
    state.currentPage,
    state.pageSize,
    state.sortBy,
    state.sortOrder,
    debouncedSearchQuery,
    state.filters
  ]);

  // Load data when dependencies change
  useEffect(() => {
    if (autoLoad) {
      fetchData();
    }
  }, [fetchData, autoLoad]);

  // Actions
  const actions: TableActions<T> = useMemo(() => ({
    setPage: (page: number) => {
      setState(prev => ({ ...prev, currentPage: page }));
    },

    setPageSize: (size: number) => {
      setState(prev => ({ 
        ...prev, 
        pageSize: size,
        currentPage: 1 // Reset to first page when changing page size
      }));
    },

    setSort: (field: string, order?: 'asc' | 'desc') => {
      setState(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: order || (prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'),
        currentPage: 1 // Reset to first page when sorting
      }));
    },

    setSearch: (query: string) => {
      setState(prev => ({ 
        ...prev, 
        searchQuery: query,
        currentPage: 1 // Reset to first page when searching
      }));
    },

    setFilters: (filters: Record<string, unknown>) => {
      setState(prev => ({ 
        ...prev, 
        filters,
        currentPage: 1 // Reset to first page when filtering
      }));
    },

    refresh: () => {
      fetchData();
    },

    reset: () => {
      setState({
        data: [],
        loading: false,
        error: null,
        totalItems: 0,
        currentPage: 1,
        pageSize: initialPageSize,
        sortBy: initialSortBy || null,
        sortOrder: initialSortOrder,
        searchQuery: '',
        filters: initialFilters
      });
    },

    updateItem: (id: string | number, updates: Partial<T>) => {
      setState(prev => ({
        ...prev,
        data: prev.data.map(item => 
          item[idField] === id ? { ...item, ...updates } : item
        )
      }));
    },

    removeItem: (id: string | number) => {
      setState(prev => ({
        ...prev,
        data: prev.data.filter(item => item[idField] !== id),
        totalItems: prev.totalItems - 1
      }));
    },

    addItem: (item: T) => {
      setState(prev => ({
        ...prev,
        data: [item, ...prev.data],
        totalItems: prev.totalItems + 1
      }));
    }
  }), [fetchData, initialPageSize, initialSortBy, initialSortOrder, initialFilters, idField]);

  // Computed values
  const enhancedState = useMemo(() => ({
    ...state,
    totalPages: Math.ceil(state.totalItems / state.pageSize),
    hasNextPage: state.currentPage * state.pageSize < state.totalItems,
    hasPreviousPage: state.currentPage > 1,
    startIndex: (state.currentPage - 1) * state.pageSize + 1,
    endIndex: Math.min(state.currentPage * state.pageSize, state.totalItems)
  }), [state]);

  return [enhancedState as TableState<T>, actions];
}

// Helper hook for client-side table operations (when data is already loaded)
export function useClientTableData<T extends Record<string, unknown>>(
  data: T[],
  options: {
    initialPageSize?: number;
    initialSortBy?: string;
    initialSortOrder?: 'asc' | 'desc';
    searchFields?: (keyof T)[];
    idField?: keyof T;
  } = {}
): [TableState<T>, TableActions<T>] {
  const {
    initialPageSize = 10,
    initialSortBy,
    initialSortOrder = 'asc',
    searchFields = [],
    idField = 'id' as keyof T
  } = options;

  const [state, setState] = useState({
    currentPage: 1,
    pageSize: initialPageSize,
    sortBy: initialSortBy || null,
    sortOrder: initialSortOrder,
    searchQuery: '',
    filters: {}
  });

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (state.searchQuery && searchFields.length > 0) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filtered = filtered.filter(item => {
          const itemValue = item[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    if (state.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[state.sortBy!];
        const bValue = b[state.sortBy!];
        
        if (aValue < bValue) return state.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return state.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, state.searchQuery, state.filters, state.sortBy, state.sortOrder, searchFields]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.pageSize;
    return processedData.slice(startIndex, startIndex + state.pageSize);
  }, [processedData, state.currentPage, state.pageSize]);

  // Create table state
  const tableState: TableState<T> = useMemo(() => ({
    data: paginatedData,
    loading: false,
    error: null,
    totalItems: processedData.length,
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    searchQuery: state.searchQuery,
    filters: state.filters
  }), [paginatedData, processedData.length, state]);

  // Actions
  const actions: TableActions<T> = useMemo(() => ({
    setPage: (page: number) => {
      setState(prev => ({ ...prev, currentPage: page }));
    },

    setPageSize: (size: number) => {
      setState(prev => ({ 
        ...prev, 
        pageSize: size,
        currentPage: 1
      }));
    },

    setSort: (field: string, order?: 'asc' | 'desc') => {
      setState(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: order || (prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'),
        currentPage: 1
      }));
    },

    setSearch: (query: string) => {
      setState(prev => ({ 
        ...prev, 
        searchQuery: query,
        currentPage: 1
      }));
    },

    setFilters: (filters: Record<string, unknown>) => {
      setState(prev => ({ 
        ...prev, 
        filters,
        currentPage: 1
      }));
    },

    refresh: () => {
      // No-op for client-side data
    },

    reset: () => {
      setState({
        currentPage: 1,
        pageSize: initialPageSize,
        sortBy: initialSortBy || null,
        sortOrder: initialSortOrder,
        searchQuery: '',
        filters: {}
      });
    },

    updateItem: () => {
      // Not applicable for client-side read-only data
      console.warn('updateItem not supported in client-side mode');
    },

    removeItem: () => {
      // Not applicable for client-side read-only data
      console.warn('removeItem not supported in client-side mode');
    },

    addItem: () => {
      // Not applicable for client-side read-only data
      console.warn('addItem not supported in client-side mode');
    }
  }), [initialPageSize, initialSortBy, initialSortOrder]);

  return [tableState, actions];
}