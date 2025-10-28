import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Save } from 'lucide-react';
import { mockCustomers } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

// Design Types theo yêu cầu
const designTypes = [
  { code: 'T', name: 'Túi giấy (Paper Bag)' },
  { code: 'C', name: 'Nhãn giấy (Paper Label)' },
  { code: 'D', name: 'Decal' },
  { code: 'H', name: 'Hộp giấy (Paper Box)' },
  { code: 'R', name: 'Decal cuộn (Roll Decal)' },
];

const formSchema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  designType: z.string().min(1, 'Vui lòng chọn loại thiết kế'),
  designName: z.string().min(1, 'Vui lòng nhập tên thiết kế').max(200),
  width: z.string().min(1, 'Vui lòng nhập chiều rộng'),
  height: z.string().min(1, 'Vui lòng nhập chiều cao'),
  notes: z.string().optional(),
  createdDate: z.string().min(1, 'Vui lòng chọn ngày tạo'),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateDesign() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generatedCode, setGeneratedCode] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      designType: '',
      designName: '',
      width: '',
      height: '',
      notes: '',
      createdDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedCustomerId = form.watch('customerId');
  const selectedDesignType = form.watch('designType');

  // Auto-generate Design Code preview
  const generateDesignCode = (customerId: string, designType: string) => {
    if (!customerId || !designType) {
      setGeneratedCode('');
      return;
    }

    const customer = mockCustomers.find((c) => c.id === customerId);
    if (!customer) return;

    // Mock sequential number (trong thực tế sẽ query từ DB)
    const sequentialNumber = '001';
    const code = `${customer.code}-${designType}${sequentialNumber}`;
    setGeneratedCode(code);
  };

  // Update code when customer or design type changes
  useState(() => {
    const subscription = form.watch((value) => {
      if (value.customerId && value.designType) {
        generateDesignCode(value.customerId, value.designType);
      }
    });
    return () => subscription.unsubscribe();
  });

  const onSubmit = (data: FormData) => {
    console.log('Design data:', data);
    console.log('Generated code:', generatedCode);

    toast({
      title: 'Tạo thiết kế thành công',
      description: `Mã thiết kế: ${generatedCode}`,
    });

    // Navigate back to design list
    setTimeout(() => {
      navigate('/design');
    }, 1500);
  };

  const selectedCustomer = mockCustomers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/design')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tạo thiết kế mới</h1>
          <p className="text-muted-foreground mt-1">Nhập thông tin thiết kế cho khách hàng</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Selection */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Khách hàng *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        generateDesignCode(value, selectedDesignType);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khách hàng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockCustomers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            [{customer.code}] {customer.companyName || customer.representativeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Show customer details */}
              {selectedCustomer && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm">
                    <strong>Mã KH:</strong> {selectedCustomer.code}
                  </p>
                  <p className="text-sm">
                    <strong>Tên:</strong> {selectedCustomer.companyName || selectedCustomer.representativeName}
                  </p>
                  <p className="text-sm">
                    <strong>SĐT:</strong> {selectedCustomer.phone}
                  </p>
                </div>
              )}

              {/* Design Type */}
              <FormField
                control={form.control}
                name="designType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại thiết kế *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        generateDesignCode(selectedCustomerId, value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại thiết kế" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {designTypes.map((type) => (
                          <SelectItem key={type.code} value={type.code}>
                            [{type.code}] {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Generated Design Code Preview */}
              {generatedCode && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <Label className="text-sm font-medium">Mã thiết kế (tự động)</Label>
                  <p className="text-lg font-bold text-primary mt-1">{generatedCode}</p>
                </div>
              )}

              {/* Design Name */}
              <FormField
                control={form.control}
                name="designName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên thiết kế / Mô tả sản phẩm *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Decal bế CREEK 2.1EC"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Size */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chiều rộng (mm) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="VD: 60"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chiều cao (mm) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="VD: 97"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Created Date */}
              <FormField
                control={form.control}
                name="createdDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày gửi khách *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Thêm ghi chú về yêu cầu thiết kế..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/design')}
            >
              Hủy
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Tạo thiết kế
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
