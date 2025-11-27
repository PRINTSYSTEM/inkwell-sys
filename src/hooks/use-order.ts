// src/hooks/order-workflow.hook.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/Schema";
import * as orderApi from "@/apis/order.api";

/**
 * Các status chính bám đúng mindmap + JSON enum trước đó
 */
export type DesignStatus =
  | "received_info" // Nhận thông tin
  | "designing" // Đang thiết kế
  | "editing" // Đang chỉnh sửa
  | "waiting_for_customer_approval" // Chờ khách duyệt
  | "confirmed_for_printing" // Đã chốt in
  | "pdf_exported"; // Xuất file PDF

export type PaymentStatus =
  | "not_paid" // Chưa thanh toán
  | "deposited" // Đã nhận cọc
  | "fully_paid"; // Đã thanh toán đủ

export type OrderStatus =
  | "pending" // Nhận thông tin
  | "waiting_for_proofing" // Chờ bình bài
  | "proofed" // Đã bình bài
  | "waiting_for_production" // Chờ sản xuất
  | "in_production" // Đang sản xuất
  | "completed" // Hoàn thành
  | "invoice_issued"; // Xuất hóa đơn

export type CustomerType = "retail" | "company";

type WorkflowPayload = {
  designStatus?: DesignStatus;
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
};

/**
 * Query keys cho Order (có thể sync với orderKeys hiện tại nếu bạn đã có)
 */
const orderWorkflowKeys = {
  all: ["orders"] as const,
  lists: () => ["orders", "list"] as const,
  detail: (id: number) => ["orders", "detail", id] as const,
} as const;

type WorkflowMutationVars = {
  orderId: number;
  payload: WorkflowPayload;
  successMessage: string;
};

/**
 * Hook tổng: trả ra các action domain-level đúng flow mindmap
 */
export const useOrderWorkflow = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation<Order, Error, WorkflowMutationVars>({
    // Bạn implement hàm này trong order.api
    mutationFn: ({ orderId, payload }) =>
      orderApi.updateOrderWorkflow(orderId, payload),
    onSuccess: (updatedOrder, { orderId, successMessage }) => {
      // update cache detail
      queryClient.setQueryData(orderWorkflowKeys.detail(orderId), updatedOrder);
      // invalidate list
      queryClient.invalidateQueries({ queryKey: orderWorkflowKeys.lists() });

      toast({
        title: "Thành công",
        description: successMessage,
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái đơn hàng",
        variant: "destructive",
      });
    },
  });

  // =========== Các action theo từng bước trong mindmap ===========

  // 1. Thiết kế

  const moveToReceivedInfo = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        designStatus: "received_info",
        orderStatus: "pending",
      },
      successMessage: "Đã chuyển thiết kế về trạng thái Nhận thông tin",
    });

  const moveToDesigning = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        designStatus: "designing",
      },
      successMessage: "Đã chuyển sang trạng thái Đang thiết kế",
    });

  const moveToEditing = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        designStatus: "editing",
      },
      successMessage: "Đã chuyển sang trạng thái Đang chỉnh sửa",
    });

  const moveToWaitingForCustomerApproval = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        designStatus: "waiting_for_customer_approval",
      },
      successMessage: "Đã chuyển sang trạng thái Chờ khách duyệt",
    });

  const moveToConfirmedForPrinting = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        designStatus: "confirmed_for_printing",
        // kế toán bắt đầu thấy đơn: tuỳ bạn trigger ở FE hay BE
      },
      successMessage: "Đã chốt in thiết kế",
    });

  const moveToPdfExported = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        designStatus: "pdf_exported",
      },
      successMessage: "Đã xuất file PDF cho thiết kế",
    });

  // 2. Thanh toán / cọc: dùng cho điều kiện khách lẻ

  const markDeposited = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        paymentStatus: "deposited",
      },
      successMessage: "Đã ghi nhận khách hàng ĐÃ NHẬN CỌC",
    });

  const markFullyPaid = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        paymentStatus: "fully_paid",
      },
      successMessage: "Đã ghi nhận khách hàng thanh toán ĐỦ",
    });

  // 3. Bình bài: tuỳ loại khách (frontend có thể check customerType trước khi gọi)

  /**
   * Chuyển sang "Chờ bình bài"
   * - Khách lẻ: nên đảm bảo paymentStatus = deposited trước khi gọi
   * - Khách công ty: chỉ cần đã chốt in
   */
  const moveToWaitingForProofing = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        orderStatus: "waiting_for_proofing",
      },
      successMessage: "Đã chuyển đơn sang trạng thái Chờ bình bài",
    });

  const moveToProofed = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        orderStatus: "proofed",
      },
      successMessage: "Đã hoàn thành bình bài",
    });

  // 4. Sản xuất

  const moveToWaitingForProduction = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        orderStatus: "waiting_for_production",
      },
      successMessage: "Đã chuyển sang Chờ sản xuất",
    });

  const moveToInProduction = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        orderStatus: "in_production",
      },
      successMessage: "Đã chuyển sang Đang sản xuất",
    });

  const moveToCompleted = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        orderStatus: "completed",
      },
      successMessage: "Đã hoàn thành sản xuất đơn hàng",
    });

  // 5. Xuất hóa đơn (kết thúc)

  const moveToInvoiceIssued = (orderId: number) =>
    mutation.mutate({
      orderId,
      payload: {
        orderStatus: "invoice_issued",
      },
      successMessage: "Đã xuất hóa đơn cho đơn hàng (bao gồm tất cả chi phí)",
    });

  // expose tất cả action + state của mutation
  return {
    // mutation state
    ...mutation,
    // design steps
    moveToReceivedInfo,
    moveToDesigning,
    moveToEditing,
    moveToWaitingForCustomerApproval,
    moveToConfirmedForPrinting,
    moveToPdfExported,
    // payment
    markDeposited,
    markFullyPaid,
    // proofing
    moveToWaitingForProofing,
    moveToProofed,
    // production
    moveToWaitingForProduction,
    moveToInProduction,
    moveToCompleted,
    // invoice
    moveToInvoiceIssued,
  };
};
