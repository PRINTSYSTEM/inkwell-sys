import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type {
  Design,
  DesignListResponse,
  DesignQueryParams,
  CreateDesignRequest,
  UpdateDesignRequest,
  CreateTimelineEntry,
  TimelineEntry
} from '@/Schema';
import * as designApi from '@/apis/design.api';

// Query Keys
export const designKeys = {
  all: ['designs'] as const,
  lists: () => [...designKeys.all, 'list'] as const,
  list: (params: DesignQueryParams) => [...designKeys.lists(), params] as const,
  details: () => [...designKeys.all, 'detail'] as const,
  detail: (id: number) => [...designKeys.details(), id] as const,
  my: () => [...designKeys.all, 'my'] as const,
  myList: (params: DesignQueryParams) => [...designKeys.my(), params] as const,
  timeline: (id: number) => [...designKeys.detail(id), 'timeline'] as const,
} as const;

// Hooks for Queries

/**
 * Hook to get all designs with pagination and filters
 */
export const useDesigns = (params?: DesignQueryParams) => {
  return useQuery({
    queryKey: designKeys.list(params || {}),
    queryFn: () => designApi.getDesigns(params),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

/**
 * Hook to get my designs (assigned to current user)
 */
export const useMyDesigns = (params?: DesignQueryParams) => {
  return useQuery({
    queryKey: designKeys.myList(params || {}),
    queryFn: () => designApi.getMyDesigns(params),
    staleTime: 5 * 60 * 1000
  });
};

/**
 * Hook to get design by ID
 */
export const useDesign = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: designKeys.detail(id),
    queryFn: () => designApi.getDesignById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get design timeline
 */
export const useDesignTimeline = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: designKeys.timeline(id),
    queryFn: () => designApi.getTimelineEntries(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000 // 2 minutes (timeline updates frequently)
  });
};

// Hooks for Mutations

/**
 * Hook to create new design
 */
export const useCreateDesign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: designApi.createDesign,
    onSuccess: (newDesign) => {
      // Invalidate and refetch design lists
      queryClient.invalidateQueries({ queryKey: designKeys.lists() });
      queryClient.invalidateQueries({ queryKey: designKeys.my() });
      
      toast({
        title: "Thành công",
        description: "Đã tạo design mới thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tạo design",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to update design
 */
export const useUpdateDesign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDesignRequest }) =>
      designApi.updateDesign(id, data),
    onSuccess: (updatedDesign, { id }) => {
      // Update the design in cache
      queryClient.setQueryData(designKeys.detail(id), updatedDesign);
      
      // Invalidate lists to ensure they reflect changes
      queryClient.invalidateQueries({ queryKey: designKeys.lists() });
      queryClient.invalidateQueries({ queryKey: designKeys.my() });
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật design thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật design",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to delete design
 */
export const useDeleteDesign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: designApi.deleteDesign,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: designKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: designKeys.lists() });
      queryClient.invalidateQueries({ queryKey: designKeys.my() });
      
      toast({
        title: "Thành công",
        description: "Đã xóa design thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa design",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to add timeline entry
 */
export const useAddTimelineEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, entry }: { id: number; entry: CreateTimelineEntry }) =>
      designApi.addTimelineEntry(id, entry),
    onSuccess: (_, { id }) => {
      // Invalidate timeline to refetch latest entries
      queryClient.invalidateQueries({ queryKey: designKeys.timeline(id) });
      
      // Also invalidate design detail as it might include timeline
      queryClient.invalidateQueries({ queryKey: designKeys.detail(id) });
      
      toast({
        title: "Thành công",
        description: "Đã thêm mục thời gian thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể thêm mục thời gian",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to generate Excel file
 */
export const useGenerateExcel = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: designApi.generateDesignExcel,
    onSuccess: (_, designId) => {
      toast({
        title: "Thành công",
        description: "Đã tạo file Excel thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tạo file Excel",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to upload design file
 */
export const useUploadDesignFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      designApi.uploadDesignFile(id, file),
    onSuccess: (_, { id }) => {
      // Invalidate design detail to refetch with new file
      queryClient.invalidateQueries({ queryKey: designKeys.detail(id) });
      
      toast({
        title: "Thành công",
        description: "Đã upload file design thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể upload file",
        variant: "destructive",
      });
    },
  });
};