// src/hooks/use-report-export.ts
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { toast } from "sonner";
import { useAsyncCallback } from "@/hooks/use-async";

import type {
  ReportExportResponse,
  ReportExportResponseIPaginate,
} from "@/Schema/report.schema";

export interface ReportExportListParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  reportCode?: string;
  exportedById?: number;
}

export const useReportExports = (params?: ReportExportListParams) => {
  return useQuery({
    queryKey: ["report-exports", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ReportExportResponseIPaginate>(
        API_SUFFIX.REPORT_EXPORTS,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useReportExport = (id: number | null, enabled = true) => {
  return useQuery({
    queryKey: ["report-export", id],
    enabled: enabled && !!id,
    queryFn: async () => {
      const res = await apiRequest.get<ReportExportResponse>(
        API_SUFFIX.REPORT_EXPORT_BY_ID(id as number)
      );
      return res.data;
    },
  });
};

export const useDownloadReportExport = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.REPORT_EXPORT_DOWNLOAD(id),
      {
        responseType: "arraybuffer",
      }
    );
    return res.data;
  });

  const download = async (id: number, filename?: string) => {
    try {
      const blob = await execute(id);

      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `report-export-${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã tải file báo cáo",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải file báo cáo",
      });
      throw err;
    }
  };

  return {
    loading,
    error,
    download,
    reset,
  };
};

