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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateDebtReconciliationAP } from "@/hooks/use-ar-ap";
import { DebtReconciliationAPRequestSchema } from "@/Schema/generated";
import { z } from "zod";
import { useActiveVendors } from "@/hooks/use-vendor";

type DebtReconciliationAPRequest = z.infer<
  typeof DebtReconciliationAPRequestSchema
>;

interface DebtReconciliationAPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DebtReconciliationAPModal({
  open,
  onOpenChange,
  onSuccess,
}: DebtReconciliationAPModalProps) {
  const { mutate, loading } = useCreateDebtReconciliationAP();
  const { data: vendorsData } = useActiveVendors();

  const form = useForm<DebtReconciliationAPRequest>({
    resolver: zodResolver(DebtReconciliationAPRequestSchema),
    defaultValues: {
      vendorId: undefined,
      fromDate: new Date().toISOString().split("T")[0],
      toDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        vendorId: undefined,
        fromDate: new Date().toISOString().split("T")[0],
        toDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, form]);

  const onSubmit = async (data: DebtReconciliationAPRequest) => {
    try {
      await mutate(data);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo biên bản đối chiếu công nợ phải trả</DialogTitle>
          <DialogDescription>
            Tạo biên bản đối chiếu công nợ với nhà cung cấp
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhà cung cấp *</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? Number.parseInt(value, 10) : undefined)
                    }
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nhà cung cấp" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendorsData?.map((vendor) => (
                        <SelectItem
                          key={vendor.id}
                          value={vendor.id?.toString() || ""}
                        >
                          {vendor.name || vendor.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Từ ngày *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đến ngày *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tạo biên bản
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
