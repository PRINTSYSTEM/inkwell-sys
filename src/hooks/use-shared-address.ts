import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX, normalizeParams } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";
import { toast } from "sonner";
import type { SharedAddress, CreateSharedAddressRequest, UpdateSharedAddressRequest } from "@/Schema";

export const useSharedAddresses = (params?: {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean | null;
}) => {
  const queryKey = ["shared-addresses", params ?? { pageNumber: 1, pageSize: 20 }];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const normalized = normalizeParams(params ?? ({} as Record<string, unknown>));
      const res = await apiRequest.get(API_SUFFIX.SHARED_ADDRESSES, {
        params: normalized,
      });
      return res.data;
    },
  });
};

export const useCreateSharedAddress = () => {
  const queryClient = useQueryClient();
  const { loading, error, execute } = useAsyncCallback<SharedAddress, [CreateSharedAddressRequest]>(
    async (payload) => {
      const res = await apiRequest.post(API_SUFFIX.SHARED_ADDRESSES, payload);
      return res.data;
    }
  );

  const mutate = async (payload: CreateSharedAddressRequest) => {
    try {
      const result = await execute(payload);
      queryClient.invalidateQueries({ queryKey: ["shared-addresses"] });
      toast.success("Đã thêm địa chỉ dùng chung");
      return result;
    } catch (err) {
      toast.error("Không thể thêm địa chỉ");
      throw err;
    }
  };

  return { loading, error, mutate };
};

export const useUpdateSharedAddress = () => {
  const queryClient = useQueryClient();
  const { loading, error, execute } = useAsyncCallback<SharedAddress, [number, UpdateSharedAddressRequest]>(
    async (id, payload) => {
      const res = await apiRequest.put(API_SUFFIX.SHARED_ADDRESS_BY_ID(id), payload);
      return res.data;
    }
  );

  const mutate = async (id: number, payload: UpdateSharedAddressRequest) => {
    try {
      const result = await execute(id, payload);
      queryClient.invalidateQueries({ queryKey: ["shared-addresses"] });
      toast.success("Đã cập nhật địa chỉ");
      return result;
    } catch (err) {
      toast.error("Không thể cập nhật địa chỉ");
      throw err;
    }
  };

  return { loading, error, mutate };
};

export const useDeleteSharedAddress = () => {
  const queryClient = useQueryClient();
  const { loading, error, execute } = useAsyncCallback<void, [number]>(
    async (id: number) => {
      await apiRequest.delete(API_SUFFIX.SHARED_ADDRESS_BY_ID(id));
    }
  );

  const mutate = async (id: number) => {
    try {
      await execute(id);
      queryClient.invalidateQueries({ queryKey: ["shared-addresses"] });
      toast.success("Đã xóa địa chỉ");
    } catch (err) {
      toast.error("Không thể xóa địa chỉ");
      throw err;
    }
  };

  return { loading, error, mutate };
};

export default null;
