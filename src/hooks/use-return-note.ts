// src/hooks/use-return-note.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { toast } from "sonner";
import type {
  CreateReturnNoteRequest,
  ReturnNoteResponse,
  ReturnableLineResponse,
} from "@/Schema/return-note.schema";

// ================== CREATE RETURN NOTE ==================
// POST /return-notes
export const useCreateReturnNote = () => {
  const queryClient = useQueryClient();

  return useMutation<ReturnNoteResponse, Error, CreateReturnNoteRequest>({
    mutationFn: async (data: CreateReturnNoteRequest) => {
      const res = await apiRequest.post<ReturnNoteResponse>(
        API_SUFFIX.RETURN_NOTES,
        data
      );
      const createdNote = res.data;
      
      // Process the return note immediately
      const processRes = await apiRequest.post<ReturnNoteResponse>(
        API_SUFFIX.RETURN_NOTE_PROCESS(createdNote.id)
      );
      return processRes.data;
    },
    onSuccess: (data, variables) => {
      const noteId = data?.deliveryNoteId || variables?.deliveryNoteId;
      if (noteId) {
        // Invalidate deliveryNote query to refresh details page and status
        queryClient.invalidateQueries({ queryKey: ["deliveryNote", noteId] });
        queryClient.invalidateQueries({ queryKey: ["deliveryNotes"] });
        // Invalidate list of return notes for this delivery note
        queryClient.invalidateQueries({
          queryKey: ["returnNotes", "by-delivery-note", noteId],
        });
        // Invalidate list of returnable lines for this delivery note
        queryClient.invalidateQueries({
          queryKey: ["deliveryNotes", noteId, "returnable-lines"],
        });
      }
      toast.success("Tạo phiếu trả hàng thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi trả hàng: ${error.message}`);
    },
  });
};

// ================== GET RETURN NOTES BY DELIVERY NOTE ==================
// GET /return-notes/by-delivery-note/{deliveryNoteId}
export const useReturnNotesByDeliveryNote = (deliveryNoteId: number | null, enabled: boolean = true) => {
  return useQuery<ReturnNoteResponse[]>({
    queryKey: ["returnNotes", "by-delivery-note", deliveryNoteId],
    enabled: enabled && !!deliveryNoteId,
    queryFn: async () => {
      const res = await apiRequest.get<ReturnNoteResponse[]>(
        API_SUFFIX.RETURN_NOTES_BY_DELIVERY_NOTE(deliveryNoteId as number)
      );
      return res.data;
    },
  });
};

// ================== GET RETURNABLE LINES BY DELIVERY NOTE ==================
// GET /delivery-notes/{deliveryNoteId}/returnable-lines
export const useReturnableLines = (deliveryNoteId: number | null, enabled: boolean = true) => {
  return useQuery<ReturnableLineResponse[]>({
    queryKey: ["deliveryNotes", deliveryNoteId, "returnable-lines"],
    enabled: enabled && !!deliveryNoteId,
    queryFn: async () => {
      const res = await apiRequest.get<ReturnableLineResponse[]>(
        API_SUFFIX.DELIVERY_NOTE_RETURNABLE_LINES(deliveryNoteId as number)
      );
      return res.data;
    },
  });
};

