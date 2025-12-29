import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import {
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  usePaymentMethod,
} from "@/hooks/use-expense";
import {
  CreatePaymentMethodRequestSchema,
  UpdatePaymentMethodRequestSchema,
  type CreatePaymentMethodRequest,
  type UpdatePaymentMethodRequest,
} from "@/Schema/accounting.schema";

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  methodId?: number | null;
  onSuccess?: () => void;
}

export function PaymentMethodModal({
  open,
  onOpenChange,
  methodId,
  onSuccess,
}: PaymentMethodModalProps) {
  const isEdit = !!methodId;
  const { data: method } = usePaymentMethod(methodId || null, open && isEdit);

  const createMutation = useCreatePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();

  const form = useForm<
    CreatePaymentMethodRequest | UpdatePaymentMethodRequest
  >({
    resolver: zodResolver(
      isEdit
        ? UpdatePaymentMethodRequestSchema
        : CreatePaymentMethodRequestSchema
    ),
    defaultValues: {
      code: "",
      name: "",
      description: null,
      isActive: true,
    },
  });

  useEffect(() => {
    if (method && isEdit) {
      form.reset({
        code: method.code || "",
        name: method.name || "",
        description: method.description || null,
        isActive: method.isActive ?? true,
      });
    } else if (!isEdit) {
      form.reset({
        code: "",
        name: "",
        description: null,
        isActive: true,
      });
    }
  }, [method, isEdit, form]);

  const onSubmit = async (
    values: CreatePaymentMethodRequest | UpdatePaymentMethodRequest
  ) => {
    try {
      if (isEdit && methodId) {
        await updateMutation.mutateAsync({
          id: methodId,
          data: values as UpdatePaymentMethodRequest,
        });
      } else {
        await createMutation.mutateAsync(values as CreatePaymentMethodRequest);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Chỉnh sửa phương thức thanh toán"
              : "Tạo phương thức thanh toán mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin phương thức thanh toán"
              : "Điền thông tin để tạo phương thức thanh toán mới"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã phương thức *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: CASH, BANK_TRANSFER"
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên phương thức *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: Tiền mặt, Chuyển khoản"
                      maxLength={200}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Mô tả về phương thức thanh toán"
                      rows={3}
                      maxLength={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Trạng thái</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Phương thức đang hoạt động
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

