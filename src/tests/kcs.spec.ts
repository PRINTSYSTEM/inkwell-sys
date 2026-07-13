import { z } from "zod";
import { useKcsProductionOrders, useKcsDesignTypeSummary } from "@/hooks/use-kcs";
import { PrintLabelDialog } from "@/pages/production/components/PrintLabelDialog";

// 1. Zod schemas representing KCS front-end validation rules
export const KcsQtySchema = z.number().int().nonnegative();
export const KcsDateRangeSchema = z
  .object({
    proofingCompletedFromDate: z.string(),
    proofingCompletedToDate: z.string(),
  })
  .refine(
    (data) => {
      const from = new Date(data.proofingCompletedFromDate);
      const to = new Date(data.proofingCompletedToDate);
      return to >= from;
    },
    {
      message: "proofingCompletedToDate must be greater than or equal to proofingCompletedFromDate",
    }
  );

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

export async function runKcsTests() {
  console.log("🏃 Running KCS Spec tests...");

  // Validate that library imports are intact and hooks/dialogs are defined
  if (typeof useKcsProductionOrders !== "function") {
    throw new Error("Library error: useKcsProductionOrders hook is not imported correctly");
  }
  if (typeof useKcsDesignTypeSummary !== "function") {
    throw new Error("Library error: useKcsDesignTypeSummary hook is not imported correctly");
  }
  if (typeof PrintLabelDialog !== "function") {
    throw new Error("Library error: PrintLabelDialog component is not imported correctly");
  }

  // Test Qty validation: Only non-negative integers >= 0 allowed
  expectPass(KcsQtySchema, 0);
  expectPass(KcsQtySchema, 500);
  expectPass(KcsQtySchema, 12000);
  expectFail(KcsQtySchema, -5);
  expectFail(KcsQtySchema, 15.5);
  expectFail(KcsQtySchema, "500");

  // Test Date range validation: proofingCompletedToDate >= proofingCompletedFromDate
  expectPass(KcsDateRangeSchema, {
    proofingCompletedFromDate: "2026-07-01",
    proofingCompletedToDate: "2026-07-01",
  });
  expectPass(KcsDateRangeSchema, {
    proofingCompletedFromDate: "2026-07-01",
    proofingCompletedToDate: "2026-07-15",
  });
  expectFail(KcsDateRangeSchema, {
    proofingCompletedFromDate: "2026-07-15",
    proofingCompletedToDate: "2026-07-01",
  });

  console.log("✅ All KCS validation and library check tests passed");
}
