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
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useExpenseCategory,
} from "@/hooks/use-expense";
import {
  CreateExpenseCategoryRequestSchema,
  UpdateExpenseCategoryRequestSchema,
  type CreateExpenseCategoryRequest,
  type UpdateExpenseCategoryRequest,
} from "@/Schema/accounting.schema";

interface ExpenseCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: number | null;
  onSuccess?: () => void;
}

export function ExpenseCategoryModal({
  open,
  onOpenChange,
  categoryId,
  onSuccess,
}: ExpenseCategoryModalProps) {
  const isEdit = !!categoryId;
  const { data: category } = useExpenseCategory(
    categoryId || null,
    open && isEdit
  );

  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();

  const form = useForm<
    CreateExpenseCategoryRequest | UpdateExpenseCategoryRequest
  >({
    resolver: zodResolver(
      isEdit
        ? UpdateExpenseCategoryRequestSchema
        : CreateExpenseCategoryRequestSchema
    ),
    defaultValues: {
      code: "",
      name: "",
      description: null,
      isActive: true,
    },
  });

  useEffect(() => {
    if (category && isEdit) {
      form.reset({
        code: category.code || "",
        name: category.name || "",
        description: category.description || null,
        isActive: category.isActive ?? true,
      });
    } else if (!isEdit) {
      form.reset({
        code: "",
        name: "",
        description: null,
        isActive: true,
      });
    }
  }, [category, isEdit, form]);

  const onSubmit = async (
    values: CreateExpenseCategoryRequest | UpdateExpenseCategoryRequest
  ) => {
    try {
      if (isEdit && categoryId) {
        await updateMutation.mutateAsync({
          id: categoryId,
          data: values as UpdateExpenseCategoryRequest,
        });
      } else {
        await createMutation.mutateAsync(
          values as CreateExpenseCategoryRequest
        );
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
            {isEdit ? "Chỉnh sửa danh mục chi phí" : "Tạo danh mục chi phí mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin danh mục chi phí"
              : "Điền thông tin để tạo danh mục chi phí mới"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã danh mục *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: EXP001"
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
                  <FormLabel>Tên danh mục *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: Chi phí văn phòng"
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
                      placeholder="Mô tả về danh mục chi phí"
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
                      Danh mục đang hoạt động
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

