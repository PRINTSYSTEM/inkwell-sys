# Schema Migration Guide

## Tổng quan

Codebase đã được refactor để sử dụng **Compat Layer Pattern**:

- `src/generated/openapi.zod.ts` là **nguồn sự thật** (source of truth) - được generate tự động từ swagger.json
- `src/Schema/generated.ts` là **compat layer** - re-export với suffix `Schema` để tương thích
- `src/Schema/*.schema.ts` là **wrapper mỏng** - giữ nguyên exports và utilities

## Kiến trúc

```
swagger.json
  → openapi-zod-client
  → src/generated/openapi.zod.ts (source of truth)
  → src/Schema/generated.ts (compat layer với suffix Schema)
  → src/Schema/*.schema.ts (wrapper + utilities)
  → hooks/pages (không đổi imports)
```

## Workflow cập nhật schema

1. **Swagger thay đổi** → chạy `npm run schema:gen`
2. File `src/generated/openapi.zod.ts` được regenerate
3. Script `build-compat-generated.mjs` tự động rebuild `src/Schema/generated.ts` với tất cả schemas
4. Các schema files (`src/Schema/*.schema.ts`) tự động lấy shape mới từ generated
5. **Không cần sửa** hooks/pages vì exports giữ nguyên

### Script tự động sync

Script `scripts/build-compat-generated.mjs` tự động:

- Đọc `schemas` object từ `openapi.zod.ts`
- Generate `src/Schema/generated.ts` với tất cả schemas có suffix `Schema`
- Đảm bảo không thiếu export khi swagger thay đổi

Chạy thủ công: `node scripts/build-compat-generated.mjs`

## Các file đã được refactor

### ✅ Hoàn thành

- `src/Schema/generated.ts` - Compat layer
- `src/Schema/customer.schema.ts` - Wrapper
- `src/Schema/order.schema.ts` - Wrapper
- `src/Schema/design.schema.ts` - Wrapper
- `src/Schema/proofing-order.schema.ts` - Wrapper
- `src/Schema/production.schema.ts` - Wrapper
- `src/Schema/invoice.schema.ts` - Wrapper
- `src/Schema/delivery-note.schema.ts` - Wrapper
- `src/Schema/accounting.schema.ts` - Wrapper
- `src/Schema/user.schema.ts` - Wrapper
- `src/Schema/paper-size.schema.ts` - Wrapper
- `src/Schema/die-export.schema.ts` - Wrapper
- `src/Schema/plate-export.schema.ts` - Wrapper
- `src/Schema/plate-vendor.schema.ts` - Wrapper
- `src/Schema/auth.schema.ts` - Wrapper
- `src/Schema/design-type.schema.ts` - Wrapper
- `src/Schema/material-type.schema.ts` - Wrapper

### 📝 Custom schemas (không có trong generated, giữ nguyên)

- `src/Schema/notification.schema.ts` - Custom notification system
- `src/Schema/params.schema.ts` - Custom query params

## Pattern refactor

### Trước (manual schema):

```ts
export const CustomerResponseSchema = z
  .object({
    id: IdSchema.optional(),
    name: NameSchema.nullable().optional(),
    // ... nhiều fields
  })
  .passthrough();
```

### Sau (wrapper từ generated):

```ts
import { CustomerResponseSchema as GenCustomerResponseSchema } from "./generated";

export const CustomerResponseSchema = GenCustomerResponseSchema.passthrough();
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;
```

## Lưu ý

1. **Giữ nguyên exports**: Tất cả exports phải giữ nguyên tên để codebase không đổi
2. **Utilities vẫn dùng**: `createPagedResponseSchema`, `validateSchema`, etc. vẫn hoạt động
3. **Custom schemas**: Các schema không có trong generated (như `CreateDesignRequestEmbedded`) vẫn giữ nguyên
4. **Passthrough**: Luôn dùng `.passthrough()` để giữ tương thích với code hiện tại

## Troubleshooting

### Lỗi: "has no exported member"

- Kiểm tra xem schema có trong `schemas` object của `openapi.zod.ts` không
- Thêm vào `src/Schema/generated.ts` nếu thiếu

### Lỗi: Type mismatch

- Generated schema dùng `.partial()` - tất cả fields optional
- Wrapper có thể cần điều chỉnh nếu có required fields

### Schema không có trong generated

- Giữ nguyên schema custom trong file `.schema.ts`
- Không cần wrapper cho schema này
