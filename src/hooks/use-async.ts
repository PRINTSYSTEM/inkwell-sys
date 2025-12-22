// src/hooks/use-async.ts
import { ServiceError } from "@/services/BaseService";
import { useState, useEffect, useCallback, useRef } from "react";
import { getErrorMessage } from "./use-base";

// ================== COMMON TYPES ==================

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch?: Date | null;
}

export interface AsyncActions<T> {
  refetch: () => Promise<void>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: string) => void;
}

export interface UseAsyncDataOptions<T> {
  // fetcher: cho phép nhận AbortSignal để hỗ trợ cancel thật sự
  fetcher: (signal?: AbortSignal) => Promise<T>;

  initialData?: T;

  // Auto-fetch options
  autoFetch?: boolean;
  fetchOnMount?: boolean;

  // Caching options
  cacheKey?: string;
  cacheTime?: number; // ms
  staleTime?: number; // ms

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

// Global cache cho async data
const asyncDataCache = new Map<string, CacheEntry<unknown>>();

// ================== useAsyncData ==================

export function useAsyncData<T>(
  options: UseAsyncDataOptions<T>
): [AsyncState<T>, AsyncActions<T>] {
  const {
    fetcher,
    initialData = null,
    autoFetch = true,
    fetchOnMount = true,
    cacheKey,
    cacheTime = 5 * 60 * 1000,
    staleTime = 1000,
    retryCount = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    deps = [],
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
    lastFetch: null,
  });

  const abortControllerRef = useRef<AbortSignal | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const isDataStale = useCallback((): boolean => {
    if (!cacheKey || !state.lastFetch) return true;

    const now = Date.now();
    const staleThreshold = state.lastFetch.getTime() + staleTime;
    return now > staleThreshold;
  }, [cacheKey, state.lastFetch, staleTime]);

  const setCachedData = useCallback(
    (data: T) => {
      if (!cacheKey) return;
      const now = Date.now();
      asyncDataCache.set(cacheKey, {
        data,
        timestamp: now,
        expiresAt: now + cacheTime,
      });
    },
    [cacheKey, cacheTime]
  );

  // Fetch với retry
  const fetchWithRetry = useCallback(
    async (attempt = 1): Promise<void> => {
      try {
        // Hủy request cũ
        if (abortControllerRef.current instanceof AbortController) {
          abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller.signal;

        setState((prev) => ({
          ...prev,
          loading: true,
          error: attempt === 1 ? null : prev.error,
        }));

        const data = await fetcher(controller.signal);

        // Nếu đã abort thì bỏ kết quả
        if (controller.signal.aborted) return;

        setState((prev) => ({
          ...prev,
          data,
          loading: false,
          error: null,
          lastFetch: new Date(),
        }));

        setCachedData(data);
        onSuccess?.(data);
      } catch (error) {
        // Nếu là abort thì không set lỗi
        if (
          abortControllerRef.current &&
          (abortControllerRef.current as AbortSignal).aborted
        ) {
          return;
        }

        // Retry
        if (attempt < retryCount) {
          retryTimeoutRef.current = setTimeout(() => {
            fetchWithRetry(attempt + 1);
          }, retryDelay * attempt);
          return;
        }

        const msg = getErrorMessage(error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: msg,
        }));

        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    },
    [fetcher, retryCount, retryDelay, setCachedData, onSuccess, onError]
  );

  const fetchData = useCallback(
    async (force = false) => {
      if (!force) {
        const cachedData = getCachedData();
        if (cachedData && !isDataStale()) {
          setState((prev) => ({
            ...prev,
            data: cachedData,
            loading: false,
            error: null,
          }));
          return;
        }
      }

      await fetchWithRetry();
    },
    [getCachedData, isDataStale, fetchWithRetry]
  );

  const actions: AsyncActions<T> = {
    refetch: () => fetchData(true),
    reset: () => {
      if (abortControllerRef.current instanceof AbortController) {
        (abortControllerRef.current as AbortSignal).onabort = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (cacheKey) {
        asyncDataCache.delete(cacheKey);
      }
      setState({
        data: initialData,
        loading: false,
        error: null,
        lastFetch: null,
      });
    },
    setData: (data: T) => {
      setState((prev) => ({
        ...prev,
        data,
        error: null,
      }));
      setCachedData(data);
    },
    setError: (error: string) => {
      setState((prev) => ({
        ...prev,
        error,
        loading: false,
      }));
    },
  };

  useEffect(() => {
    if (autoFetch && (fetchOnMount || deps.length > 0)) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current instanceof AbortController) {
        abortControllerRef.current.abort?.();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, autoFetch, fetchOnMount, ...deps]);

  return [state, actions];
}

// ================== useAsyncDataList ==================

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
    loadingStates: {} as Record<keyof T, boolean>,
  });

  const keys = Object.keys(fetchers) as (keyof T)[];

  const fetchAll = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      errors: {},
      loadingStates: keys.reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>
      ),
    }));

    try {
      if (parallel) {
        const results = await Promise.allSettled(
          keys.map(async (key) => {
            try {
              const result = await fetchers[key]();
              return {
                key,
                data: result as T[keyof T],
                error: null as string | null,
              };
            } catch (error) {
              return {
                key,
                data: null,
                error: error instanceof Error ? error.message : "Có lỗi xảy ra",
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

          if (result.status === "fulfilled") {
            const { data: itemData, error } = result.value;
            if (error) {
              errors[key] = error;
            } else if (itemData !== null) {
              data[key] = itemData as T[keyof T];
            }
          } else {
            errors[key] = "Request failed";
          }
        });

        setState((prev) => ({
          ...prev,
          data: Object.keys(errors).length === keys.length ? null : data,
          loading: false,
          errors,
          loadingStates,
        }));

        if (Object.keys(errors).length === 0) {
          onSuccess?.(data);
        } else {
          onError?.(errors);
        }
      } else {
        const data = {} as T;
        const errors: Partial<Record<keyof T, string>> = {};
        const loadingStates = {} as Record<keyof T, boolean>;

        for (const key of keys) {
          try {
            const result = await fetchers[key]();
            data[key] = result as T[keyof T];
            loadingStates[key] = false;

            setState((prev) => ({
              ...prev,
              data: { ...(prev.data ?? {}), [key]: result } as T,
              loadingStates: { ...prev.loadingStates, [key]: false },
            }));
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Có lỗi xảy ra";
            errors[key] = errorMessage;
            loadingStates[key] = false;

            setState((prev) => ({
              ...prev,
              errors: { ...prev.errors, [key]: errorMessage },
              loadingStates: { ...prev.loadingStates, [key]: false },
            }));
          }
        }

        setState((prev) => ({ ...prev, loading: false }));

        if (Object.keys(errors).length === 0) {
          onSuccess?.(data);
        } else {
          onError?.(errors);
        }
      }
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        errors: keys.reduce(
          (acc, key) => ({ ...acc, [key]: "Unexpected error occurred" }),
          {} as Partial<Record<keyof T, string>>
        ),
        loadingStates: keys.reduce(
          (acc, key) => ({ ...acc, [key]: false }),
          {} as Record<keyof T, boolean>
        ),
      }));
    }
  }, [fetchers, keys, parallel, onSuccess, onError]);

  const fetchOne = useCallback(
    async (key: keyof T) => {
      setState((prev) => ({
        ...prev,
        loadingStates: { ...prev.loadingStates, [key]: true },
        errors: { ...prev.errors, [key]: undefined },
      }));

      try {
        const result = await fetchers[key]();
        setState((prev) => ({
          ...prev,
          data: { ...(prev.data ?? {}), [key]: result } as T,
          loadingStates: { ...prev.loadingStates, [key]: false },
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Có lỗi xảy ra";
        setState((prev) => ({
          ...prev,
          errors: { ...prev.errors, [key]: errorMessage },
          loadingStates: { ...prev.loadingStates, [key]: false },
        }));
      }
    },
    [fetchers]
  );

  const actions = {
    refetch: fetchAll,
    refetchOne: fetchOne,
    reset: () => {
      setState({
        data: null,
        loading: false,
        errors: {},
        loadingStates: {} as Record<keyof T, boolean>,
      });
    },
  };

  useEffect(() => {
    if (autoFetch) {
      fetchAll();
    }
  }, [fetchAll, autoFetch]);

  return [state, actions];
}

// ================== useAsync + useAsyncCallback ==================

export function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const refetch = useCallback(() => execute(), [execute]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    refetch,
    reset,
  };
}

export function useAsyncCallback<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await asyncFunction(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        setState({ data: null, loading: false, error: errorMessage });
        throw error;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
