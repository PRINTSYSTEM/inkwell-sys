import { z } from "zod";
import {
  CreateCustomerRequestSchema,
  CreateUserRequestSchema,
  CreateDesignTypeRequestSchema,
  CreateMaterialTypeRequestSchema,
  CreateDesignRequestSchema,
  CreateOrderRequestSchema,
  CreateOrderWithExistingDesignsRequestSchema,
  CreateProofingOrderRequestSchema,
  CreateProofingOrderFromDesignsRequestSchema,
} from "@/Schema";
import { ChangePasswordRequestSchema } from "@/Schema/auth.schema";

function expectPass<T>(schema: z.ZodSchema<T>, data: unknown) {
  const res = schema.safeParse(data);
  if (!res.success) {
    throw new Error("Expected pass but failed: " + JSON.stringify(res.error.format()));
  }
}

function expectFail<T>(schema: z.ZodSchema<T>, data: unknown) {
  const res = schema.safeParse(data);
  if (res.success) {
    throw new Error("Expected fail but passed");
  }
}

export async function runValidationTests() {
  // Customer
  expectPass(CreateCustomerRequestSchema, {
    name: "Khách Hàng A",
    companyName: "Công Ty ABC",
    representativeName: "Nguyễn Văn B",
    phone: "+84 912345678",
    taxCode: "1234567890",
    address: "123 Đường XYZ, Quận 1",
    type: "company",
    maxDebt: 0,
  });
  expectFail(CreateCustomerRequestSchema, {
    name: "A",
    companyName: "",
    representativeName: "",
    phone: "abc",
    taxCode: "123",
    address: "",
    type: "company",
    maxDebt: -1,
  });

  // User
  expectPass(CreateUserRequestSchema, {
    username: "john_doe",
    password: "Abcdef12",
    fullName: "John Doe",
    role: "design",
    email: "john@example.com",
    phone: "+84 912345678",
  });
  expectFail(CreateUserRequestSchema, {
    username: "jd",
    password: "short",
    fullName: "J",
    role: "design",
    email: "invalid",
    phone: "abc",
  });

  // Design Type
  expectPass(CreateDesignTypeRequestSchema, {
    code: "DT-01",
    name: "Logo",
    displayOrder: 0,
    status: "active",
  });
  expectFail(CreateDesignTypeRequestSchema, {
    code: "dt@01",
    name: "",
    displayOrder: -1,
    status: "active",
  });

  // Material Type
  expectPass(CreateMaterialTypeRequestSchema, {
    designTypeId: 1,
    code: "MT-01",
    name: "Decal",
  });
  expectFail(CreateMaterialTypeRequestSchema, {
    designTypeId: 1,
    code: "mt@01",
    name: "",
  });

  // Design
  expectPass(CreateDesignRequestSchema, {
    designTypeId: 1,
    materialTypeId: 2,
    quantity: 1,
    width: 10,
    height: 20,
  });
  expectFail(CreateDesignRequestSchema, {
    designTypeId: 1,
    materialTypeId: 2,
    quantity: 0,
    width: -1,
    height: -1,
  });

  // Order
  expectPass(CreateOrderRequestSchema, {
    customerId: 1,
    deliveryAddress: "123 Street",
    totalAmount: 100000,
    depositAmount: 50000,
    designs: [],
  });
  expectFail(CreateOrderRequestSchema, {
    customerId: 1,
    totalAmount: 100000,
    depositAmount: 150000,
  });

  // Order Existing Designs
  expectPass(CreateOrderWithExistingDesignsRequestSchema, {
    customerId: 1,
    totalAmount: 200000,
    depositAmount: 100000,
    designs: [{ designId: 3, quantity: 2 }],
  });
  expectFail(CreateOrderWithExistingDesignsRequestSchema, {
    customerId: 1,
    totalAmount: -1,
    depositAmount: 0,
    designs: [],
  });

  // Proofing Order
  expectPass(CreateProofingOrderRequestSchema, {
    materialTypeId: 1,
    designIds: [1, 2],
  });
  expectFail(CreateProofingOrderRequestSchema, {
    materialTypeId: 1,
    designIds: [],
  });

  // Proofing from designs
  expectPass(CreateProofingOrderFromDesignsRequestSchema, {
    designIds: [1],
  });
  expectFail(CreateProofingOrderFromDesignsRequestSchema, {
    designIds: [],
  });

  // Change password
  expectPass(ChangePasswordRequestSchema, {
    currentPassword: "OldPass1",
    newPassword: "NewPass1",
    confirmPassword: "NewPass1",
  });
  expectFail(ChangePasswordRequestSchema, {
    currentPassword: "Old",
    newPassword: "weak",
    confirmPassword: "notmatch",
  });

  console.log("✅ All validation tests passed");
}

// Auto-run in dev mode when imported via Vite
if (import.meta.env?.DEV) {
  runValidationTests().catch((e) => {
    console.error("❌ Validation tests failed", e);
  });
}
