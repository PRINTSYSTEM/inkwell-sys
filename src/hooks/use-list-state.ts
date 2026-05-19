import { useState, useEffect, useRef } from "react";
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

  // Initialize state from URL params or fallback to options
  const initialPage = parseInt(searchParams.get("page") || options.defaultPage?.toString() || "1", 10);
  const initialSearch = searchParams.get("search") || options.defaultSearch || "";
  const initialStatus = searchParams.get("status") || options.defaultStatus || "all";
  const initialSortColumn = searchParams.get("sortCol") || options.defaultSortColumn || "";
  const initialSortOrder = (searchParams.get("sortOrder") as SortOrder) || options.defaultSortOrder || "desc";

  console.log("[useListState] Init:", { 
    url: window.location.href, 
    pageParam: searchParams.get("page"), 
    initialPage 
  });

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sortColumn, setSortColumn] = useState(initialSortColumn);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  // Sync state changes back to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (currentPage > 1) params.set("page", currentPage.toString());
    else params.delete("page");

    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    else params.delete("search");

    if (statusFilter !== "all" && statusFilter !== "") params.set("status", statusFilter);
    else params.delete("status");

    if (sortColumn) {
      params.set("sortCol", sortColumn);
      params.set("sortOrder", sortOrder);
    } else {
      params.delete("sortCol");
      params.delete("sortOrder");
    }

    setSearchParams(params, { replace: true });
  }, [currentPage, debouncedSearchTerm, statusFilter, sortColumn, sortOrder, setSearchParams]);

  // Reset to page 1 when filters change, but skip the first render
  const isMounted = useRef(false);
  useEffect(() => {
    if (isMounted.current) {
      console.log("[useListState] Filter changed, resetting to page 1. Values:", { debouncedSearchTerm, statusFilter, sortColumn, sortOrder });
      setCurrentPage(1);
    } else {
      isMounted.current = true;
    }
  }, [debouncedSearchTerm, statusFilter, sortColumn, sortOrder]);

  // Expose reset function for filter changes
  const resetPage = () => setCurrentPage(1);

  return {
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    statusFilter,
    setStatusFilter,
    sortColumn,
    setSortColumn,
    sortOrder,
    setSortOrder,
    resetPage
  };
}
