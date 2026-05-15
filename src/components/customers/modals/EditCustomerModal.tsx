import { useEffect, useMemo } from "react";
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
  scrapRate: z.number().min(0, "Tỷ lệ bù hao không được âm").optional(),
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
    },
  );
};

// Schema cơ bản (không có công nợ)
const basicFormSchema = addCompanyNameValidation(baseFormSchema);



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

  // Cho phép tất cả các role chỉnh sửa công nợ
  const canEditDebt = true;

  // Sử dụng schema phù hợp, cho phép số âm nếu nó là số cũ chưa sửa
  const formSchema = useMemo(() => {
    return addCompanyNameValidation(
      baseFormSchema.extend({
        currentDebt: z.number().refine(
          (val) => val >= 0 || val === customer.currentDebt,
          {
            message:
              "Dữ liệu nợ mới không được phép âm. Vui lòng đưa về 0 hoặc số dương.",
          },
        ),
        maxDebt: z.number().min(0, "Hạn mức không được âm"),
      }),
    );
  }, [customer.currentDebt]);

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
    scrapRate: customer.scrapRate ?? 0,
    currentDebt: customer.currentDebt ?? 0,
    maxDebt: customer.maxDebt ?? 0,
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
    const data: any = {
      ...values,
      phone: values.phone?.trim() === "" ? null : values.phone,
      email: values.email?.trim() === "" ? null : values.email,
    };

    // TỐI ƯU: Nếu công nợ hoặc hạn mức không thay đổi, KHÔNG gửi lên backend
    // Điều này giúp tránh lỗi validation 400 của backend đối với các số âm cũ
    if (values.currentDebt === customer.currentDebt) {
      delete data.currentDebt;
    }
    if (values.maxDebt === customer.maxDebt) {
      delete data.maxDebt;
    }

    await updateCustomer.mutateAsync({
      id: customer.id,
      data: data,
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

            <FormField
              control={form.control}
              name="scrapRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tỷ lệ bù hao</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-9 flex-1"
                      />
                      <span className="text-sm font-medium text-muted-foreground shrink-0">
                        ≈ {Math.round((Number(field.value) || 0) * 10000) / 100}%
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <div className="space-y-1">
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          disabled // Khóa không cho phép sửa trực tiếp tại đây
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? "" : Number(val));
                          }}
                          className="h-9 bg-muted cursor-not-allowed"
                        />
                        <div className="text-[11px] font-medium text-primary/80 italic flex items-center flex-wrap gap-x-2">
                          <span>
                            {field.value !== "" ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(Number(field.value) || 0) : "0 ₫"}
                          </span>
                          {customer.currentDebt !== undefined &&
                            customer.currentDebt !== Number(field.value) && (
                              <span className="text-destructive font-bold not-italic">
                                (Số dư thực tế:{" "}
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(customer.currentDebt)}
                                )
                              </span>
                            )}
                        </div>
                      </div>
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
                      <div className="space-y-1">
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? "" : Number(val));
                          }}
                          className="h-9"
                        />
                        <div className="text-[11px] font-medium text-primary/80 italic">
                          {field.value !== "" ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(Number(field.value) || 0) : "0 ₫"}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
