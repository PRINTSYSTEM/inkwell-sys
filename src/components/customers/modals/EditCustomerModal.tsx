import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail } from "lucide-react";
import { useUpdateCustomer } from "@/hooks/use-customer";
import { useAuth } from "@/hooks";
import { ROLE } from "@/constants";
import type { CustomerResponse } from "@/Schema";

// Schema base (chưa có refine)
const baseFormSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  companyName: z.string().optional(),
  representativeName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  taxCode: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(["retail", "company"]),
});

// Helper function để thêm validation cho companyName khi type là company
const addCompanyNameValidation = <T extends z.ZodTypeAny>(schema: T) => {
  return schema.refine(
    (data: any) => {
      // Nếu type là "company" thì companyName phải có giá trị
      if (data.type === "company") {
        return (
          data.companyName !== undefined &&
          data.companyName !== null &&
          data.companyName.trim().length > 0
        );
      }
      return true;
    },
    {
      message: "Tên công ty là bắt buộc khi chọn loại khách hàng là Công ty",
      path: ["companyName"], // Đặt lỗi vào field companyName
    }
  );
};

// Schema cơ bản (không có công nợ)
const basicFormSchema = addCompanyNameValidation(baseFormSchema);

// Schema đầy đủ (có công nợ) - extend trước, refine sau
const fullFormSchema = addCompanyNameValidation(
  baseFormSchema.extend({
    currentDebt: z.number().min(0, "Công nợ không được âm"),
    maxDebt: z.number().min(0, "Hạn mức không được âm"),
  })
);

interface EditCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerResponse;
}

export function EditCustomerModal({
  open,
  onOpenChange,
  customer,
}: EditCustomerModalProps) {
  const updateCustomer = useUpdateCustomer();
  const { user } = useAuth();
  const userRole = user?.role;

  // Chỉ role accounting và admin mới edit được công nợ
  const canEditDebt =
    userRole === ROLE.ACCOUNTING ||
    userRole === ROLE.ACCOUNTING_LEAD ||
    userRole === ROLE.ADMIN;

  // Sử dụng schema phù hợp
  const formSchema = canEditDebt ? fullFormSchema : basicFormSchema;
  type FormValues = z.infer<typeof formSchema>;

  const defaultValues: Partial<FormValues> = {
    name: customer.name ?? "",
    companyName: customer.companyName ?? "",
    representativeName: customer.representativeName ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    taxCode: customer.taxCode ?? "",
    address: customer.address ?? "",
    type: (customer.type === "retail" || customer.type === "company"
      ? customer.type
      : "retail") as "retail" | "company",
    ...(canEditDebt && {
      currentDebt: customer.currentDebt ?? 0,
      maxDebt: customer.maxDebt ?? 0,
    }),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const customerType = form.watch("type");

  // Trigger validation khi type thay đổi để hiển thị lỗi ngay lập tức
  useEffect(() => {
    if (customerType === "company") {
      form.trigger("companyName");
    }
  }, [customerType, form]);

  const onSubmit = async (values: FormValues) => {
    // Nếu không có quyền edit công nợ, giữ nguyên giá trị công nợ hiện tại
    const updateData: Partial<FormValues> & {
      currentDebt?: number;
      maxDebt?: number;
    } = { ...values };
    if (!canEditDebt) {
      updateData.currentDebt = customer.currentDebt ?? 0;
      updateData.maxDebt = customer.maxDebt ?? 0;
    }

    await updateCustomer.mutateAsync({
      id: customer.id,
      data: updateData,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Tên khách hàng *</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Loại khách hàng</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="retail">Cá nhân</SelectItem>
                        <SelectItem value="company">Công ty</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Số điện thoại</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="example@email.com"
                          className="h-9 pl-9"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {customerType === "company" && (
              <>
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        Tên công ty <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="h-9" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="representativeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Người đại diện
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Mã số thuế</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Địa chỉ</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} className="resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Chỉ hiển thị trường công nợ nếu có quyền */}
            {canEditDebt && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentDebt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        Công nợ hiện tại
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxDebt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Hạn mức công nợ</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
