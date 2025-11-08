import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DateRange } from 'react-day-picker';
import { 
  FormField, 
  FormSection, 
  ValidationMessage, 
  AsyncSelect, 
  DateRangePicker,
  createSimpleOptions,
  mockLoadOptions
} from '@/components/forms';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Building, Calendar, Settings } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  // Personal information
  firstName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  lastName: z.string().min(2, 'Họ phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  
  // Work information
  department: z.string().min(1, 'Vui lòng chọn phòng ban'),
  position: z.string().min(1, 'Vui lòng chọn chức vụ'),
  manager: z.string().optional(),
  
  // Project details
  projectType: z.string().min(1, 'Vui lòng chọn loại dự án'),
  skills: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất 1 kỹ năng'),
  
  // Settings
  notifications: z.boolean().default(true),
  autoAssign: z.boolean().default(false),
  
  // Additional
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export const ExampleForm: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      manager: '',
      projectType: '',
      skills: [],
      notifications: true,
      autoAssign: false,
      notes: '',
    },
  });

  // Mock data for selects
  const departmentOptions = createSimpleOptions([
    { value: 'design', label: 'Phòng Thiết kế' },
    { value: 'production', label: 'Phòng Sản xuất' },
    { value: 'sales', label: 'Phòng Kinh doanh' },
    { value: 'hr', label: 'Phòng Nhân sự' },
  ]);

  const skillOptions = createSimpleOptions([
    { value: 'photoshop', label: 'Adobe Photoshop' },
    { value: 'illustrator', label: 'Adobe Illustrator' },
    { value: 'indesign', label: 'Adobe InDesign' },
    { value: 'figma', label: 'Figma' },
    { value: 'sketch', label: 'Sketch' },
  ]);

  const managerOptions = createSimpleOptions([
    { value: 'manager1', label: 'Nguyễn Văn A' },
    { value: 'manager2', label: 'Trần Thị B' },
    { value: 'manager3', label: 'Lê Văn C' },
  ]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Form submitted:', { ...data, dateRange });
      setSubmitSuccess(true);
      form.reset();
      setDateRange(undefined);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Form Components Demo</CardTitle>
        <CardDescription>
          Ví dụ sử dụng các form components với validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Success Message */}
          {submitSuccess && (
            <ValidationMessage
              type="success"
              message="Form đã được gửi thành công!"
              dismissible
              onDismiss={() => setSubmitSuccess(false)}
            />
          )}

          {/* Personal Information Section */}
          <FormSection
            title="Thông tin cá nhân"
            description="Nhập thông tin cơ bản của nhân viên"
            icon={User}
            required
            variant="card"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Họ"
                required
                error={form.formState.errors.lastName?.message}
                helperText="Nhập họ đệm của nhân viên"
              >
                <Input
                  {...form.register('lastName')}
                  placeholder="Nhập họ"
                />
              </FormField>

              <FormField
                label="Tên"
                required
                error={form.formState.errors.firstName?.message}
              >
                <Input
                  {...form.register('firstName')}
                  placeholder="Nhập tên"
                />
              </FormField>

              <FormField
                label="Email"
                required
                error={form.formState.errors.email?.message}
              >
                <Input
                  {...form.register('email')}
                  type="email"
                  placeholder="example@company.com"
                />
              </FormField>

              <FormField
                label="Số điện thoại"
                error={form.formState.errors.phone?.message}
              >
                <Input
                  {...form.register('phone')}
                  placeholder="0123 456 789"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Work Information Section */}
          <FormSection
            title="Thông tin công việc"
            description="Thông tin về vị trí và phòng ban làm việc"
            icon={Building}
            required
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Phòng ban"
                required
                error={form.formState.errors.department?.message}
              >
                <AsyncSelect
                  value={form.watch('department')}
                  onValueChange={(value) => form.setValue('department', value as string)}
                  placeholder="Chọn phòng ban"
                  loadOptions={mockLoadOptions(departmentOptions)}
                />
              </FormField>

              <FormField
                label="Chức vụ"
                required
                error={form.formState.errors.position?.message}
              >
                <Select onValueChange={(value) => form.setValue('position', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chức vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="designer">Designer</SelectItem>
                    <SelectItem value="senior-designer">Senior Designer</SelectItem>
                    <SelectItem value="lead-designer">Lead Designer</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Quản lý trực tiếp"
                helperText="Người quản lý trực tiếp của nhân viên này"
              >
                <AsyncSelect
                  value={form.watch('manager')}
                  onValueChange={(value) => form.setValue('manager', value as string)}
                  placeholder="Chọn quản lý"
                  loadOptions={mockLoadOptions(managerOptions)}
                  showClear
                />
              </FormField>

              <FormField
                label="Kỹ năng"
                required
                error={form.formState.errors.skills?.message}
              >
                <AsyncSelect
                  value={form.watch('skills')}
                  onValueChange={(value) => form.setValue('skills', value as string[])}
                  placeholder="Chọn kỹ năng"
                  loadOptions={mockLoadOptions(skillOptions)}
                  multiple
                />
              </FormField>
            </div>
          </FormSection>

          {/* Date Range Section */}
          <FormSection
            title="Thời gian dự án"
            description="Chọn khoảng thời gian thực hiện dự án"
            icon={Calendar}
            variant="inline"
          >
            <FormField
              label="Thời gian thực hiện"
              helperText="Chọn ngày bắt đầu và kết thúc dự án"
            >
              <DateRangePicker
                value={dateRange}
                onValueChange={setDateRange}
                placeholder="Chọn khoảng thời gian"
              />
            </FormField>
          </FormSection>

          {/* Settings Section */}
          <FormSection
            title="Cài đặt"
            description="Tùy chọn thông báo và tự động hóa"
            icon={Settings}
            variant="inline"
            collapsible
          >
            <div className="space-y-4">
              <FormField
                label="Nhận thông báo email"
                helperText="Nhận email khi có cập nhật dự án"
              >
                <Switch
                  checked={form.watch('notifications')}
                  onCheckedChange={(checked) => form.setValue('notifications', checked)}
                />
              </FormField>

              <FormField
                label="Tự động phân công"
                helperText="Tự động phân công nhiệm vụ dựa trên kỹ năng"
              >
                <Switch
                  checked={form.watch('autoAssign')}
                  onCheckedChange={(checked) => form.setValue('autoAssign', checked)}
                />
              </FormField>
            </div>
          </FormSection>

          {/* Notes Section */}
          <FormSection
            title="Ghi chú"
            description="Thông tin bổ sung"
            variant="inline"
          >
            <FormField
              label="Ghi chú"
              helperText="Thông tin bổ sung về nhân viên hoặc dự án"
            >
              <Textarea
                {...form.register('notes')}
                placeholder="Nhập ghi chú..."
                rows={4}
              />
            </FormField>
          </FormSection>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setDateRange(undefined);
              }}
            >
              Đặt lại
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi form'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};