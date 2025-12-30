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
  useCreateBankAccount,
  useUpdateBankAccount,
  useBankAccount,
} from "@/hooks/use-bank";
import {
  CreateBankAccountRequestSchema,
  UpdateBankAccountRequestSchema,
  type CreateBankAccountRequest,
  type UpdateBankAccountRequest,
} from "@/Schema/accounting.schema";

interface BankAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: number | null;
  onSuccess?: () => void;
}

export function BankAccountModal({
  open,
  onOpenChange,
  accountId,
  onSuccess,
}: BankAccountModalProps) {
  const isEdit = !!accountId;
  const { data: account } = useBankAccount(accountId || null, open && isEdit);

  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();

  const form = useForm<CreateBankAccountRequest | UpdateBankAccountRequest>({
    resolver: zodResolver(
      isEdit ? UpdateBankAccountRequestSchema : CreateBankAccountRequestSchema
    ),
    defaultValues: {
      accountNumber: "",
      bankName: "",
      bankBranch: null,
      accountHolder: "",
      description: null,
      openingBalance: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (account && isEdit) {
      form.reset({
        accountNumber: account.accountNumber || "",
        bankName: account.bankName || "",
        bankBranch: account.bankBranch || null,
        accountHolder: account.accountHolder || "",
        description: account.description || null,
        openingBalance: account.openingBalance || 0,
        isActive: account.isActive ?? true,
      });
    } else if (!isEdit) {
      form.reset({
        accountNumber: "",
        bankName: "",
        bankBranch: null,
        accountHolder: "",
        description: null,
        openingBalance: 0,
        isActive: true,
      });
    }
  }, [account, isEdit, form]);

  const onSubmit = async (
    values: CreateBankAccountRequest | UpdateBankAccountRequest
  ) => {
    try {
      if (isEdit && accountId) {
        await updateMutation.mutateAsync({
          id: accountId,
          data: values as UpdateBankAccountRequest,
        });
      } else {
        await createMutation.mutateAsync(values as CreateBankAccountRequest);
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa tài khoản ngân hàng" : "Tạo tài khoản ngân hàng mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin tài khoản ngân hàng"
              : "Điền thông tin để tạo tài khoản ngân hàng mới"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tài khoản *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: 1234567890"
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên ngân hàng *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: Vietcombank"
                      maxLength={200}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankBranch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chi nhánh</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="VD: Chi nhánh Hà Nội"
                      maxLength={200}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountHolder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chủ tài khoản *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: Công ty ABC"
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
                      placeholder="Mô tả về tài khoản ngân hàng"
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
                      Tài khoản đang hoạt động
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

