import { useState, useMemo, useCallback } from 'react';

export interface FilterValue {
  value: unknown;
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'nin';
  type?: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

export interface FilterState {
  filters: Record<string, FilterValue>;
  searchQuery: string;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  activeFiltersCount: number;
}

export interface FilterActions {
  setFilter: (key: string, value: unknown, operator?: FilterValue['operator']) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  setSearch: (query: string) => void;
  setSort: (field: string, order?: 'asc' | 'desc') => void;
  clearSort: () => void;
  reset: () => void;
  applyFilters: <T>(data: T[], options?: FilterOptions<T>) => T[];
}

export interface FilterOptions<T> {
  // Fields to search in when using search query
  searchFields?: (keyof T)[];
  
  // Custom filter functions
  customFilters?: {
    [K in keyof T]?: (value: T[K], filterValue: FilterValue) => boolean;
  };
  
  // Case sensitivity for string operations
  caseSensitive?: boolean;
  
  // Date comparison format
  dateFormat?: string;
}

export interface UseFiltersOptions {
  // Initial filters
  initialFilters?: Record<string, FilterValue>;
  
  // Initial search
  initialSearch?: string;
  
  // Initial sort
  initialSort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  
  // Auto-save to localStorage
  persistKey?: string;
}

export function useFilters(
  options: UseFiltersOptions = {}
): [FilterState, FilterActions] {
  const {
    initialFilters = {},
    initialSearch = '',
    initialSort,
    persistKey
  } = options;

  // Load persisted state
  const getPersistedState = useCallback(() => {
    if (!persistKey) return null;
    
    try {
      const saved = localStorage.getItem(`filters_${persistKey}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [persistKey]);

  // Initialize state
  const [state, setState] = useState<FilterState>(() => {
    const persisted = getPersistedState();
    
    return {
      filters: persisted?.filters || initialFilters,
      searchQuery: persisted?.searchQuery || initialSearch,
      sortBy: persisted?.sortBy || initialSort?.field || null,
      sortOrder: persisted?.sortOrder || initialSort?.order || 'asc',
      activeFiltersCount: Object.keys(persisted?.filters || initialFilters).length
    };
  });

  // Persist state
  const persistState = useCallback((newState: FilterState) => {
    if (persistKey) {
      try {
        localStorage.setItem(`filters_${persistKey}`, JSON.stringify(newState));
      } catch (error) {
        console.warn('Failed to persist filters:', error);
      }
    }
  }, [persistKey]);

  // Filter comparison functions
  const compareValues = useCallback((
    itemValue: unknown, 
    filterValue: FilterValue,
    caseSensitive = false
  ): boolean => {
    const { value, operator = 'eq', type = 'string' } = filterValue;

    if (value === undefined || value === null || value === '') {
      return true;
    }

    // Handle null/undefined item values
    if (itemValue === undefined || itemValue === null) {
      return operator === 'ne';
    }

    // Type conversion and comparison
    switch (type) {
      case 'string': {
        const itemStr = String(itemValue);
        const filterStr = String(value);
        const item = caseSensitive ? itemStr : itemStr.toLowerCase();
        const filter = caseSensitive ? filterStr : filterStr.toLowerCase();

        switch (operator) {
          case 'eq': return item === filter;
          case 'ne': return item !== filter;
          case 'contains': return item.includes(filter);
          case 'startsWith': return item.startsWith(filter);
          case 'endsWith': return item.endsWith(filter);
          default: return item === filter;
        }
      }

      case 'number': {
        const itemNum = Number(itemValue);
        const filterNum = Number(value);
        
        if (isNaN(itemNum) || isNaN(filterNum)) return false;

        switch (operator) {
          case 'eq': return itemNum === filterNum;
          case 'ne': return itemNum !== filterNum;
          case 'gt': return itemNum > filterNum;
          case 'gte': return itemNum >= filterNum;
          case 'lt': return itemNum < filterNum;
          case 'lte': return itemNum <= filterNum;
          default: return itemNum === filterNum;
        }
      }

      case 'boolean': {
        const itemBool = Boolean(itemValue);
        const filterBool = Boolean(value);
        return operator === 'ne' ? itemBool !== filterBool : itemBool === filterBool;
      }

      case 'date': {
        const itemDate = new Date(itemValue as string | number | Date);
        const filterDate = new Date(value as string | number | Date);
        
        if (isNaN(itemDate.getTime()) || isNaN(filterDate.getTime())) return false;

        switch (operator) {
          case 'eq': return itemDate.getTime() === filterDate.getTime();
          case 'ne': return itemDate.getTime() !== filterDate.getTime();
          case 'gt': return itemDate > filterDate;
          case 'gte': return itemDate >= filterDate;
          case 'lt': return itemDate < filterDate;
          case 'lte': return itemDate <= filterDate;
          default: return itemDate.getTime() === filterDate.getTime();
        }
      }

      case 'array': {
        if (!Array.isArray(value)) return false;
        
        switch (operator) {
          case 'in': return value.includes(itemValue);
          case 'nin': return !value.includes(itemValue);
          default: return value.includes(itemValue);
        }
      }

      default:
        return String(itemValue) === String(value);
    }
  }, []);

  // Search in multiple fields
  const searchInFields = useCallback(<T>(
    item: T,
    query: string,
    searchFields: (keyof T)[],
    caseSensitive = false
  ): boolean => {
    if (!query) return true;
    
    const searchTerm = caseSensitive ? query : query.toLowerCase();
    
    return searchFields.some(field => {
      const fieldValue = item[field];
      if (fieldValue === undefined || fieldValue === null) return false;
      
      const fieldStr = String(fieldValue);
      const searchIn = caseSensitive ? fieldStr : fieldStr.toLowerCase();
      
      return searchIn.includes(searchTerm);
    });
  }, []);

  // Actions
  const actions: FilterActions = useMemo(() => ({
    setFilter: (key: string, value: unknown, operator?: FilterValue['operator']) => {
      setState(prev => {
        const newFilters = { ...prev.filters };
        
        if (value === undefined || value === null || value === '') {
          delete newFilters[key];
        } else {
          newFilters[key] = {
            value,
            operator: operator || 'eq',
            type: typeof value === 'number' ? 'number' 
                : typeof value === 'boolean' ? 'boolean'
                : Array.isArray(value) ? 'array'
                : value instanceof Date ? 'date'
                : 'string'
          };
        }
        
        const newState = {
          ...prev,
          filters: newFilters,
          activeFiltersCount: Object.keys(newFilters).length
        };
        
        persistState(newState);
        return newState;
      });
    },

    removeFilter: (key: string) => {
      setState(prev => {
        const newFilters = { ...prev.filters };
        delete newFilters[key];
        
        const newState = {
          ...prev,
          filters: newFilters,
          activeFiltersCount: Object.keys(newFilters).length
        };
        
        persistState(newState);
        return newState;
      });
    },

    clearFilters: () => {
      setState(prev => {
        const newState = {
          ...prev,
          filters: {},
          activeFiltersCount: 0
        };
        
        persistState(newState);
        return newState;
      });
    },

    setSearch: (query: string) => {
      setState(prev => {
        const newState = { ...prev, searchQuery: query };
        persistState(newState);
        return newState;
      });
    },

    setSort: (field: string, order?: 'asc' | 'desc') => {
      setState(prev => {
        const newOrder = order || (prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc');
        const newState = {
          ...prev,
          sortBy: field,
          sortOrder: newOrder
        };
        
        persistState(newState);
        return newState;
      });
    },

    clearSort: () => {
      setState(prev => {
        const newState = {
          ...prev,
          sortBy: null,
          sortOrder: 'asc' as const
        };
        
        persistState(newState);
        return newState;
      });
    },

    reset: () => {
      const newState = {
        filters: initialFilters,
        searchQuery: initialSearch,
        sortBy: initialSort?.field || null,
        sortOrder: initialSort?.order || 'asc' as const,
        activeFiltersCount: Object.keys(initialFilters).length
      };
      
      setState(newState);
      persistState(newState);
    },

    applyFilters: <T>(data: T[], options: FilterOptions<T> = {}) => {
      const {
        searchFields = [],
        customFilters = {},
        caseSensitive = false
      } = options;

      let result = [...data];

      // Apply search query
      if (state.searchQuery && searchFields.length > 0) {
        result = result.filter(item => 
          searchInFields(item, state.searchQuery, searchFields, caseSensitive)
        );
      }

      // Apply filters
      Object.entries(state.filters).forEach(([key, filterValue]) => {
        result = result.filter(item => {
          const itemValue = item[key as keyof T];
          
          // Use custom filter if available
          const customFilter = customFilters && customFilters[key as keyof T];
          if (customFilter) {
            return customFilter(itemValue, filterValue);
          }
          
          // Use default comparison
          return compareValues(itemValue, filterValue, caseSensitive);
        });
      });

      // Apply sorting
      if (state.sortBy) {
        result.sort((a, b) => {
          const aValue = a[state.sortBy as keyof T];
          const bValue = b[state.sortBy as keyof T];
          
          // Handle null/undefined values
          if (aValue === null || aValue === undefined) {
            return bValue === null || bValue === undefined ? 0 : 1;
          }
          if (bValue === null || bValue === undefined) {
            return -1;
          }
          
          // Type-specific comparison
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return state.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          }
          
          if (aValue instanceof Date && bValue instanceof Date) {
            const diff = aValue.getTime() - bValue.getTime();
            return state.sortOrder === 'asc' ? diff : -diff;
          }
          
          // String comparison (default)
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();
          
          if (aStr < bStr) return state.sortOrder === 'asc' ? -1 : 1;
          if (aStr > bStr) return state.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }

      return result;
    }
  }), [state, persistState, initialFilters, initialSearch, initialSort, compareValues, searchInFields]);

  return [state, actions];
}

// Helper hook for quick filtering without persistence
export function useQuickFilters<T>() {
  return useFilters();
}

// Helper functions for creating common filter values
export const filterHelpers = {
  equals: (value: unknown): FilterValue => ({ value, operator: 'eq' }),
  notEquals: (value: unknown): FilterValue => ({ value, operator: 'ne' }),
  contains: (value: string): FilterValue => ({ value, operator: 'contains', type: 'string' }),
  startsWith: (value: string): FilterValue => ({ value, operator: 'startsWith', type: 'string' }),
  endsWith: (value: string): FilterValue => ({ value, operator: 'endsWith', type: 'string' }),
  greaterThan: (value: number): FilterValue => ({ value, operator: 'gt', type: 'number' }),
  greaterThanOrEqual: (value: number): FilterValue => ({ value, operator: 'gte', type: 'number' }),
  lessThan: (value: number): FilterValue => ({ value, operator: 'lt', type: 'number' }),
  lessThanOrEqual: (value: number): FilterValue => ({ value, operator: 'lte', type: 'number' }),
  inArray: (values: unknown[]): FilterValue => ({ value: values, operator: 'in', type: 'array' }),
  notInArray: (values: unknown[]): FilterValue => ({ value: values, operator: 'nin', type: 'array' }),
  dateAfter: (date: Date): FilterValue => ({ value: date, operator: 'gt', type: 'date' }),
  dateBefore: (date: Date): FilterValue => ({ value: date, operator: 'lt', type: 'date' }),
  dateRange: (start: Date, end: Date) => ({
    start: { value: start, operator: 'gte' as const, type: 'date' as const },
    end: { value: end, operator: 'lte' as const, type: 'date' as const }
  })
};