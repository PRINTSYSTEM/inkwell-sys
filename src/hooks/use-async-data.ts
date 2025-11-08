import { useState, useEffect, useCallback, useRef } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

export interface AsyncActions<T> {
  refetch: () => Promise<void>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: string) => void;
}

export interface UseAsyncDataOptions<T> {
  // Data fetcher function
  fetcher: () => Promise<T>;
  
  // Initial data
  initialData?: T;
  
  // Auto-fetch options
  autoFetch?: boolean;
  fetchOnMount?: boolean;
  
  // Caching options
  cacheKey?: string;
  cacheTime?: number; // in milliseconds
  staleTime?: number; // in milliseconds
  
  // Retry options
  retryCount?: number;
  retryDelay?: number;
  
  // Callbacks
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  
  // Dependencies to trigger refetch
  deps?: unknown[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Global cache for async data
const asyncDataCache = new Map<string, CacheEntry<unknown>>();

export function useAsyncData<T>(
  options: UseAsyncDataOptions<T>
): [AsyncState<T>, AsyncActions<T>] {
  const {
    fetcher,
    initialData = null,
    autoFetch = true,
    fetchOnMount = true,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 1000, // 1 second
    retryCount = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    deps = []
  } = options;

  // State
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
    lastFetch: null
  });

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get cached data
  const getCachedData = useCallback((): T | null => {
    if (!cacheKey) return null;

    const cached = asyncDataCache.get(cacheKey) as CacheEntry<T> | undefined;
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      asyncDataCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }, [cacheKey]);

  // Check if data is stale
  const isDataStale = useCallback((): boolean => {
    if (!cacheKey || !state.lastFetch) return true;

    const now = Date.now();
    const staleThreshold = state.lastFetch.getTime() + staleTime;
    return now > staleThreshold;
  }, [cacheKey, state.lastFetch, staleTime]);

  // Set cached data
  const setCachedData = useCallback((data: T) => {
    if (!cacheKey) return;

    const now = Date.now();
    asyncDataCache.set(cacheKey, {
      data,
      timestamp: now,
      expiresAt: now + cacheTime
    });
  }, [cacheKey, cacheTime]);

  // Fetch data with retry logic
  const fetchWithRetry = useCallback(async (attempt = 1): Promise<void> => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: attempt === 1 ? null : prev.error 
      }));

      const data = await fetcher();

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setState(prev => ({ 
        ...prev, 
        data, 
        loading: false, 
        error: null,
        lastFetch: new Date()
      }));

      // Cache the data
      setCachedData(data);

      // Call success callback
      if (onSuccess) {
        onSuccess(data);
      }

    } catch (error) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';

      // Retry logic
      if (attempt < retryCount) {
        retryTimeoutRef.current = setTimeout(() => {
          fetchWithRetry(attempt + 1);
        }, retryDelay * attempt); // Exponential backoff
        return;
      }

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));

      // Call error callback
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  }, [fetcher, retryCount, retryDelay, setCachedData, onSuccess, onError]);

  // Main fetch function
  const fetchData = useCallback(async (force = false) => {
    // Check cache first (unless forced)
    if (!force) {
      const cachedData = getCachedData();
      if (cachedData && !isDataStale()) {
        setState(prev => ({ 
          ...prev, 
          data: cachedData, 
          loading: false, 
          error: null 
        }));
        return;
      }
    }

    await fetchWithRetry();
  }, [getCachedData, isDataStale, fetchWithRetry]);

  // Actions
  const actions: AsyncActions<T> = {
    refetch: () => fetchData(true),
    
    reset: () => {
      // Cancel ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Clear cache
      if (cacheKey) {
        asyncDataCache.delete(cacheKey);
      }

      setState({
        data: initialData,
        loading: false,
        error: null,
        lastFetch: null
      });
    },
    
    setData: (data: T) => {
      setState(prev => ({ 
        ...prev, 
        data, 
        error: null 
      }));
      setCachedData(data);
    },
    
    setError: (error: string) => {
      setState(prev => ({ 
        ...prev, 
        error, 
        loading: false 
      }));
    }
  };

  // Effect for auto-fetch and dependency changes
  useEffect(() => {
    if (autoFetch && (fetchOnMount || deps.length > 0)) {
      fetchData();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchData, autoFetch, fetchOnMount, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return [state, actions];
}

// Helper hook for loading multiple resources
export function useAsyncDataList<T extends Record<string, unknown>>(
  fetchers: Record<keyof T, () => Promise<T[keyof T]>>,
  options: {
    parallel?: boolean;
    autoFetch?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (errors: Partial<Record<keyof T, string>>) => void;
  } = {}
): [
  { 
    data: T | null; 
    loading: boolean; 
    errors: Partial<Record<keyof T, string>>; 
    loadingStates: Record<keyof T, boolean>;
  },
  { 
    refetch: () => Promise<void>; 
    refetchOne: (key: keyof T) => Promise<void>;
    reset: () => void; 
  }
] {
  const { parallel = true, autoFetch = true, onSuccess, onError } = options;

  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    errors: Partial<Record<keyof T, string>>;
    loadingStates: Record<keyof T, boolean>;
  }>({
    data: null,
    loading: false,
    errors: {},
    loadingStates: {} as Record<keyof T, boolean>
  });

  const fetchAll = useCallback(async () => {
    const keys = Object.keys(fetchers) as (keyof T)[];
    
    setState(prev => ({
      ...prev,
      loading: true,
      errors: {},
      loadingStates: keys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<keyof T, boolean>)
    }));

    try {
      if (parallel) {
        // Fetch all in parallel
        const results = await Promise.allSettled(
          keys.map(async key => {
            try {
              const result = await fetchers[key]();
              return { key, data: result, error: null };
            } catch (error) {
              return { 
                key, 
                data: null, 
                error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
              };
            }
          })
        );

        const data = {} as T;
        const errors: Partial<Record<keyof T, string>> = {};
        const loadingStates = {} as Record<keyof T, boolean>;

        results.forEach((result, index) => {
          const key = keys[index];
          loadingStates[key] = false;

          if (result.status === 'fulfilled') {
            const { data: itemData, error } = result.value;
            if (error) {
              errors[key] = error;
            } else {
              data[key] = itemData;
            }
          } else {
            errors[key] = 'Request failed';
          }
        });

        setState(prev => ({
          ...prev,
          data: Object.keys(errors).length === keys.length ? null : data,
          loading: false,
          errors,
          loadingStates
        }));

        if (Object.keys(errors).length === 0 && onSuccess) {
          onSuccess(data);
        } else if (Object.keys(errors).length > 0 && onError) {
          onError(errors);
        }

      } else {
        // Fetch sequentially
        const data = {} as T;
        const errors: Partial<Record<keyof T, string>> = {};
        const loadingStates = {} as Record<keyof T, boolean>;

        for (const key of keys) {
          try {
            const result = await fetchers[key]();
            data[key] = result;
            loadingStates[key] = false;
            
            setState(prev => ({
              ...prev,
              data: { ...prev.data, [key]: result } as T,
              loadingStates: { ...prev.loadingStates, [key]: false }
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
            errors[key] = errorMessage;
            loadingStates[key] = false;
            
            setState(prev => ({
              ...prev,
              errors: { ...prev.errors, [key]: errorMessage },
              loadingStates: { ...prev.loadingStates, [key]: false }
            }));
          }
        }

        setState(prev => ({ ...prev, loading: false }));

        if (Object.keys(errors).length === 0 && onSuccess) {
          onSuccess(data);
        } else if (Object.keys(errors).length > 0 && onError) {
          onError(errors);
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        errors: keys.reduce((acc, key) => ({ 
          ...acc, 
          [key]: 'Unexpected error occurred' 
        }), {} as Partial<Record<keyof T, string>>),
        loadingStates: keys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<keyof T, boolean>)
      }));
    }
  }, [fetchers, parallel, onSuccess, onError]);

  const fetchOne = useCallback(async (key: keyof T) => {
    setState(prev => ({
      ...prev,
      loadingStates: { ...prev.loadingStates, [key]: true },
      errors: { ...prev.errors, [key]: undefined }
    }));

    try {
      const result = await fetchers[key]();
      setState(prev => ({
        ...prev,
        data: { ...prev.data, [key]: result } as T,
        loadingStates: { ...prev.loadingStates, [key]: false }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [key]: errorMessage },
        loadingStates: { ...prev.loadingStates, [key]: false }
      }));
    }
  }, [fetchers]);

  const actions = {
    refetch: fetchAll,
    refetchOne: fetchOne,
    reset: () => {
      setState({
        data: null,
        loading: false,
        errors: {},
        loadingStates: {} as Record<keyof T, boolean>
      });
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchAll();
    }
  }, [fetchAll, autoFetch]);

  return [state, actions];
}