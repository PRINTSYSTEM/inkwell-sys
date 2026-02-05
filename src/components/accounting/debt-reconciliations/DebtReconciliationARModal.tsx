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
import { useCreateDebtReconciliationAR } from "@/hooks/use-ar-ap";
import { DebtReconciliationARRequestSchema } from "@/Schema/generated";
import { z } from "zod";
import { useCustomers } from "@/hooks/use-customer";

type DebtReconciliationARRequest = z.infer<
  typeof DebtReconciliationARRequestSchema
>;

interface DebtReconciliationARModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DebtReconciliationARModal({
  open,
  onOpenChange,
  onSuccess,
}: DebtReconciliationARModalProps) {
  const { mutate, loading } = useCreateDebtReconciliationAR();
  const { data: customersData } = useCustomers({
    pageNumber: 1,
    pageSize: 1000,
  });

  const form = useForm<DebtReconciliationARRequest>({
    resolver: zodResolver(DebtReconciliationARRequestSchema),
    defaultValues: {
      customerId: undefined,
      fromDate: new Date().toISOString().split("T")[0],
      toDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        customerId: undefined,
        fromDate: new Date().toISOString().split("T")[0],
        toDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, form]);

  const onSubmit = async (data: DebtReconciliationARRequest) => {
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
          <DialogTitle>Tạo biên bản đối chiếu công nợ phải thu</DialogTitle>
          <DialogDescription>
            Tạo biên bản đối chiếu công nợ với khách hàng
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Khách hàng *</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? Number.parseInt(value, 10) : undefined)
                    }
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khách hàng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customersData?.items?.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id?.toString() || ""}
                        >
                          {customer.name || customer.companyName || customer.code}
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
