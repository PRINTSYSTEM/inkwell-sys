import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "use-debounce";
import type { SortOrder } from "@/components/ui/sort-controls";

export interface ListStateOptions {
  defaultPage?: number;
  defaultSearch?: string;
  defaultStatus?: string;
  defaultSortColumn?: string;
  defaultSortOrder?: SortOrder;
  storageKey?: string;
}

export function useListState(options: ListStateOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Storage key prefix to separate list pages state
  const prefix = options.storageKey || `list_state_${window.location.pathname}`;

  // Helper to read initial values from URL search parameters OR sessionStorage
  const getInitialValue = useCallback((paramKey: string, defaultValue: string) => {
    const urlVal = new URLSearchParams(window.location.search).get(paramKey);
    if (urlVal !== null) return urlVal;
    const savedVal = sessionStorage.getItem(`${prefix}_${paramKey}`);
    if (savedVal !== null) return savedVal;
    return defaultValue;
  }, [prefix]);

  // Page reads directly from URL — this is the single source of truth.
  const currentPage = parseInt(
    getInitialValue("page", options.defaultPage?.toString() || "1"),
    10
  );

  // Other filters kept in local state
  const [searchTerm, setSearchTerm] = useState(
    () => getInitialValue("search", options.defaultSearch || "")
  );
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  
  const [statusFilter, setStatusFilter] = useState(
    () => getInitialValue("status", options.defaultStatus || "all")
  );
  const [sortColumn, setSortColumn] = useState(
    () => getInitialValue("sortCol", options.defaultSortColumn || "")
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    () => getInitialValue("sortOrder", options.defaultSortOrder || "desc") as SortOrder
  );

  const initialSyncRef = useRef(false);

  // Sync initial state values to URL if they aren't there
  useEffect(() => {
    if (initialSyncRef.current) return;
    initialSyncRef.current = true;

    const params = new URLSearchParams(window.location.search);
    let changed = false;

    const initPage = getInitialValue("page", options.defaultPage?.toString() || "1");
    if (!params.has("page") && initPage !== "1") {
      params.set("page", initPage);
      changed = true;
    }
    const initSearch = getInitialValue("search", options.defaultSearch || "");
    if (!params.has("search") && initSearch !== "") {
      params.set("search", initSearch);
      changed = true;
    }
    const initStatus = getInitialValue("status", options.defaultStatus || "all");
    if (!params.has("status") && initStatus !== "all") {
      params.set("status", initStatus);
      changed = true;
    }
    const initSortCol = getInitialValue("sortCol", options.defaultSortColumn || "");
    if (!params.has("sortCol") && initSortCol !== "") {
      params.set("sortCol", initSortCol);
      changed = true;
    }
    const initSortOrder = getInitialValue("sortOrder", options.defaultSortOrder || "desc");
    if (!params.has("sortOrder") && initSortOrder !== "desc") {
      params.set("sortOrder", initSortOrder);
      changed = true;
    }

    if (changed) {
      setSearchParams(params, { replace: true });
    }
  }, [getInitialValue, options.defaultPage, options.defaultSearch, options.defaultStatus, options.defaultSortColumn, options.defaultSortOrder, setSearchParams]);

  // Keep local states in sync with URL search params (e.g. for browser back/forward)
  useEffect(() => {
    const searchVal = searchParams.get("search") || options.defaultSearch || "";
    setSearchTerm(searchVal);

    const statusVal = searchParams.get("status") || options.defaultStatus || "all";
    setStatusFilter(statusVal);

    const sortColVal = searchParams.get("sortCol") || options.defaultSortColumn || "";
    setSortColumn(sortColVal);

    const sortOrderVal = (searchParams.get("sortOrder") as SortOrder) || options.defaultSortOrder || "desc";
    setSortOrder(sortOrderVal);
  }, [window.location.search, options.defaultSearch, options.defaultStatus, options.defaultSortColumn, options.defaultSortOrder]);

  // Sync URL search params → sessionStorage
  useEffect(() => {
    const page = searchParams.get("page");
    if (page) sessionStorage.setItem(`${prefix}_page`, page);
    else sessionStorage.removeItem(`${prefix}_page`);

    const search = searchParams.get("search");
    if (search) sessionStorage.setItem(`${prefix}_search`, search);
    else sessionStorage.removeItem(`${prefix}_search`);

    const status = searchParams.get("status");
    if (status) sessionStorage.setItem(`${prefix}_status`, status);
    else sessionStorage.removeItem(`${prefix}_status`);

    const sortCol = searchParams.get("sortCol");
    if (sortCol) sessionStorage.setItem(`${prefix}_sortCol`, sortCol);
    else sessionStorage.removeItem(`${prefix}_sortCol`);

    const sortOrder = searchParams.get("sortOrder");
    if (sortOrder) sessionStorage.setItem(`${prefix}_sortOrder`, sortOrder);
    else sessionStorage.removeItem(`${prefix}_sortOrder`);
  }, [searchParams, prefix]);

  // -- Page setter: writes page to URL --
  const setCurrentPage = useCallback(
    (pageOrUpdater: number | ((prev: number) => number)) => {
      const newPage =
        typeof pageOrUpdater === "function"
          ? pageOrUpdater(currentPage)
          : pageOrUpdater;
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (newPage > 1) params.set("page", newPage.toString());
          else params.delete("page");
          return params;
        },
        { replace: true }
      );
    },
    [currentPage, setSearchParams]
  );

  const resetPage = useCallback(() => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete("page");
        return params;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  // -- Sync debouncedSearchTerm → URL, reset page on change --
  const prevDebouncedSearch = useRef<string | null>(null);
  useEffect(() => {
    if (prevDebouncedSearch.current === null) {
      prevDebouncedSearch.current = debouncedSearchTerm;
      return;
    }
    if (prevDebouncedSearch.current === debouncedSearchTerm) return;
    prevDebouncedSearch.current = debouncedSearchTerm;

    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
        else params.delete("search");
        params.delete("page"); // reset to page 1
        return params;
      },
      { replace: true }
    );
  }, [debouncedSearchTerm, setSearchParams]);

  // -- Status filter setter: updates URL + resets page --
  const wrappedSetStatusFilter = useCallback(
    (value: string) => {
      setStatusFilter(value);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (value && value !== "all") params.set("status", value);
          else params.delete("status");
          params.delete("page");
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // -- Sort column setter: updates URL + resets page --
  const wrappedSetSortColumn = useCallback(
    (value: string) => {
      setSortColumn(value);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (value) params.set("sortCol", value);
          else params.delete("sortCol");
          params.delete("page");
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // -- Sort order setter: updates URL + resets page --
  const wrappedSetSortOrder = useCallback(
    (value: SortOrder) => {
      setSortOrder(value);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("sortOrder", value);
          params.delete("page");
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return {
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    statusFilter,
    setStatusFilter: wrappedSetStatusFilter,
    sortColumn,
    setSortColumn: wrappedSetSortColumn,
    sortOrder,
    setSortOrder: wrappedSetSortOrder,
    resetPage,
  };
}
