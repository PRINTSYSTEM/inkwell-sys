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
}

export function useListState(options: ListStateOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Page reads directly from URL — this is the single source of truth.
  // When the user navigates back, the browser restores the URL (?page=2)
  // and this value is automatically correct without any reset risk.
  const currentPage = parseInt(
    searchParams.get("page") || options.defaultPage?.toString() || "1",
    10
  );

  // Other filters kept in local state (initialized once from URL on mount)
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") || options.defaultSearch || ""
  );
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || options.defaultStatus || "all"
  );
  const [sortColumn, setSortColumn] = useState(
    () => searchParams.get("sortCol") || options.defaultSortColumn || ""
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    () =>
      (searchParams.get("sortOrder") as SortOrder) ||
      options.defaultSortOrder ||
      "desc"
  );

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
  // Use null sentinel so the effect skips the FIRST mount.
  // This is critical: on back navigation the component remounts, and we must
  // NOT reset page to 1 just because the effect fires for the first time.
  const prevDebouncedSearch = useRef<string | null>(null);
  useEffect(() => {
    if (prevDebouncedSearch.current === null) {
      // First mount — record current value, do nothing
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
