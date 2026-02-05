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
import { useCreateDebtNotification } from "@/hooks/use-debt-notification";
import { CreateDebtNotificationRequestSchema } from "@/Schema/generated";
import { z } from "zod";
import { useCustomers } from "@/hooks/use-customer";

type CreateDebtNotificationRequest = z.infer<
  typeof CreateDebtNotificationRequestSchema
>;

interface DebtNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DebtNotificationModal({
  open,
  onOpenChange,
  onSuccess,
}: DebtNotificationModalProps) {
  const { mutate, loading } = useCreateDebtNotification();
  const { data: customersData } = useCustomers({
    pageNumber: 1,
    pageSize: 1000,
  });

  const form = useForm<CreateDebtNotificationRequest>({
    resolver: zodResolver(CreateDebtNotificationRequestSchema),
    defaultValues: {
      type: "AR",
      subject: "",
      body: "",
      customerIds: [],
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        type: "AR",
        subject: "",
        body: "",
        customerIds: [],
      });
    }
  }, [open, form]);

  const onSubmit = async (data: CreateDebtNotificationRequest) => {
    try {
      await mutate(data);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo thông báo công nợ</DialogTitle>
          <DialogDescription>
            Tạo thông báo nhắc nợ cho khách hàng
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại công nợ</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại công nợ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AR">Công nợ phải thu</SelectItem>
                      <SelectItem value="AP">Công nợ phải trả</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tiêu đề thông báo..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung thông báo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập nội dung thông báo..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                Tạo thông báo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
