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
  useCreateCashFund,
  useUpdateCashFund,
  useCashFund,
} from "@/hooks/use-cash";
import {
  CreateCashFundRequestSchema,
  UpdateCashFundRequestSchema,
  type CreateCashFundRequest,
  type UpdateCashFundRequest,
  type CashFundResponse,
} from "@/Schema/accounting.schema";

interface CashFundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundId?: number | null;
  onSuccess?: () => void;
}

export function CashFundModal({
  open,
  onOpenChange,
  fundId,
  onSuccess,
}: CashFundModalProps) {
  const isEdit = !!fundId;
  const { data: fund } = useCashFund(fundId || null, open && isEdit);

  const createMutation = useCreateCashFund();
  const updateMutation = useUpdateCashFund();

  const form = useForm<CreateCashFundRequest | UpdateCashFundRequest>({
    resolver: zodResolver(
      isEdit ? UpdateCashFundRequestSchema : CreateCashFundRequestSchema
    ),
    defaultValues: {
      code: "",
      name: "",
      description: null,
      openingBalance: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (fund && isEdit) {
      form.reset({
        code: fund.code || "",
        name: fund.name || "",
        description: fund.description || null,
        openingBalance: fund.openingBalance || 0,
        isActive: fund.isActive ?? true,
      });
    } else if (!isEdit) {
      form.reset({
        code: "",
        name: "",
        description: null,
        openingBalance: 0,
        isActive: true,
      });
    }
  }, [fund, isEdit, form]);

  const onSubmit = async (
    values: CreateCashFundRequest | UpdateCashFundRequest
  ) => {
    try {
      if (isEdit && fundId) {
        await updateMutation.mutateAsync({
          id: fundId,
          data: values as UpdateCashFundRequest,
        });
      } else {
        await createMutation.mutateAsync(values as CreateCashFundRequest);
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
            {isEdit ? "Chỉnh sửa quỹ tiền mặt" : "Tạo quỹ tiền mặt mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin quỹ tiền mặt"
              : "Điền thông tin để tạo quỹ tiền mặt mới"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã quỹ *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: CF001"
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
                  <FormLabel>Tên quỹ *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: Quỹ tiền mặt chính"
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
                      placeholder="Mô tả về quỹ tiền mặt"
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
              name="openingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số dư đầu kỳ</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(Number.parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
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
                      Quỹ đang hoạt động
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

