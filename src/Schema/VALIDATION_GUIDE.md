# Validation Guide

Hướng dẫn sử dụng validation với Zod schemas trong dự án.

## Tổng quan

Dự án sử dụng Zod để validate dữ liệu. Tất cả các schema được định nghĩa trong thư mục `src/Schema/` và có các utility functions để validate và hiển thị lỗi.

## Utility Functions

### 1. `validateSchema<T>(schema, data)`

Validate dữ liệu với schema và trả về kết quả.

```typescript
import { validateSchema, CreateCustomerRequestSchema } from "@/Schema";

const result = validateSchema(CreateCustomerRequestSchema, formData);
if (result.success) {
  // result.data chứa dữ liệu đã được validate và parse
  console.log(result.data);
} else {
  // result.errors chứa ZodError
  console.error(result.errors);
}
```

### 2. `formatValidationErrors(error)`

Format ZodError thành object với field paths và error messages.

```typescript
import { formatValidationErrors } from "@/Schema";

const result = validateSchema(CreateCustomerRequestSchema, formData);
if (!result.success) {
  const errors = formatValidationErrors(result.errors);
  // errors = { "name": ["Tên không được để trống"], "phone": ["Số điện thoại không hợp lệ"] }
}
```

### 3. `formatValidationErrorsFlat(error)`

Format ZodError thành object với chỉ message đầu tiên cho mỗi field.

```typescript
import { formatValidationErrorsFlat } from "@/Schema";

const result = validateSchema(CreateCustomerRequestSchema, formData);
if (!result.success) {
  const errors = formatValidationErrorsFlat(result.errors);
  // errors = { "name": "Tên không được để trống", "phone": "Số điện thoại không hợp lệ" }
}
```

### 4. `getFieldError(error, fieldPath)`

Lấy error message cho một field cụ thể.

```typescript
import {
  validateSchema,
  getFieldError,
  CreateCustomerRequestSchema,
} from "@/Schema";

const result = validateSchema(CreateCustomerRequestSchema, formData);
if (!result.success) {
  const nameError = getFieldError(result.errors, "name");
  // nameError = "Tên không được để trống" hoặc undefined
}
```

## Hooks

### `useFormValidation<T>(schema)`

Hook để quản lý validation state cho form.

```typescript
import { useFormValidation } from "@/hooks";
import { CreateCustomerRequestSchema } from "@/Schema";

function CreateCustomerForm() {
  const [form, setForm] = useState({ name: "", phone: "" });

  const {
    errors, // Record<string, string> - errors cho tất cả fields
    validateForm, // (data) => boolean - validate toàn bộ form
    validateAndParse, // (data) => T | null - validate và trả về parsed data
    getError, // (fieldPath) => string | undefined - lấy error cho field
    hasError, // (fieldPath) => boolean - check field có error không
    clearFieldError, // (fieldPath) => void - xóa error cho field
    clearAllErrors, // () => void - xóa tất cả errors
    touchField, // (fieldPath) => void - đánh dấu field đã touched
    isFieldTouched, // (fieldPath) => boolean - check field đã touched chưa
  } = useFormValidation(CreateCustomerRequestSchema);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate và parse
    const payload = validateAndParse(form);
    if (!payload) {
      // Validation failed, errors đã được set tự động
      return;
    }

    // Gửi request với payload đã validate
    await createCustomer(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={form.name}
        onChange={(e) => {
          setForm({ ...form, name: e.target.value });
          clearFieldError("name"); // Xóa error khi user nhập
        }}
        onBlur={() => touchField("name")} // Đánh dấu field đã touched
        className={hasError("name") ? "border-destructive" : ""}
      />
      <FormFieldError error={getError("name")} />
    </form>
  );
}
```

### `useValidatedMutation(mutation, schema, options)`

Wrap mutation với validation.

```typescript
import { useValidatedMutation } from "@/hooks";
import { useCreateCustomer } from "@/hooks";
import { CreateCustomerRequestSchema } from "@/Schema";

function CreateCustomerForm() {
  const createCustomerMutation = useCreateCustomer();

  const validatedMutation = useValidatedMutation(
    createCustomerMutation,
    CreateCustomerRequestSchema,
    {
      validateBeforeMutate: true,
      showValidationErrors: true,
    }
  );

  const handleSubmit = async (formData: unknown) => {
    // Validation sẽ được thực hiện tự động trước khi gọi API
    await validatedMutation.mutateAsync(formData);
  };
}
```

## Components

### `FormFieldError`

Component để hiển thị validation error cho một field.

```typescript
import { FormFieldError } from "@/components/ui/form-field-error";

<FormFieldError error={getError("name")} />;
```

## Best Practices

1. **Validate ở form level**: Sử dụng `useFormValidation` để validate form data trước khi submit.

2. **Validate ở mutation level**: Sử dụng `useValidatedMutation` để validate trước khi gọi API (optional, nếu muốn double-check).

3. **Hiển thị errors ngay lập tức**: Sử dụng `FormFieldError` component để hiển thị errors cho từng field.

4. **Clear errors khi user nhập**: Gọi `clearFieldError` khi user bắt đầu nhập lại.

5. **Touch fields khi blur**: Gọi `touchField` khi field bị blur để chỉ hiển thị errors cho các fields đã được touch.

## Ví dụ hoàn chỉnh

```typescript
import { useState } from "react";
import { useFormValidation } from "@/hooks";
import { FormFieldError } from "@/components/ui/form-field-error";
import { CreateCustomerRequestSchema, CreateCustomerRequest } from "@/Schema";
import { useCreateCustomer } from "@/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateCustomerForm() {
  const [form, setForm] = useState<CreateCustomerRequest>({
    name: "",
    phone: "",
    // ... other fields
  });

  const { mutateAsync: createCustomer, isPending } = useCreateCustomer();

  const {
    errors,
    validateAndParse,
    getError,
    clearFieldError,
    touchField,
    hasError,
  } = useFormValidation(CreateCustomerRequestSchema);

  const handleInput = (field: keyof CreateCustomerRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = validateAndParse(form);
    if (!payload) {
      return; // Validation failed
    }

    try {
      await createCustomer(payload);
    } catch (error) {
      // Error đã được handle bởi mutation hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <Input
          value={form.name}
          onChange={(e) => handleInput("name", e.target.value)}
          onBlur={() => touchField("name")}
          className={hasError("name") ? "border-destructive" : ""}
        />
        <FormFieldError error={getError("name")} />
      </div>

      <Button type="submit" disabled={isPending}>
        Tạo khách hàng
      </Button>
    </form>
  );
}
```
