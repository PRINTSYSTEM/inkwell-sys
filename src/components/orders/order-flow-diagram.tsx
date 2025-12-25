import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Order statuses from backend
type OrderStatus =
  | "pending"
  | "designing"
  | "waiting_for_customer_approval"
  | "editing"
  | "confirmed_for_printing"
  | "waiting_for_deposit"
  | "deposit_received"
  | "debt_approved"
  | "waiting_for_proofing"
  | "waiting_for_production"
  | "in_production"
  | "production_completed"
  | "invoice_issued"
  | "delivering"
  | "completed"
  | "cancelled"
  | (string & {});

interface FlowStep {
  id: string;
  label: string;
  completed: boolean;
  active: boolean;
}

interface OrderFlowDiagramProps {
  currentStatus: OrderStatus | null;
  customerType: "retail" | "company";
  hasDeposit: boolean;
}

// Define status order for comparison
// Note: delivering comes before invoice_issued (giao hàng trước xuất hóa đơn)
const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "designing",
  "waiting_for_customer_approval",
  "editing",
  "confirmed_for_printing",
  "waiting_for_deposit",
  "deposit_received",
  "debt_approved",
  "waiting_for_proofing",
  "waiting_for_production",
  "in_production",
  "production_completed",
  "delivering",
  "invoice_issued",
  "completed",
];

export function OrderFlowDiagram({
  currentStatus,
  customerType,
  hasDeposit,
}: OrderFlowDiagramProps) {
  const status = (currentStatus || "pending") as OrderStatus;

  // Helper to check if current status is at or past a certain point
  const isAtOrPast = (targetStatuses: OrderStatus[]): boolean => {
    const currentIndex = STATUS_ORDER.indexOf(status);
    return targetStatuses.some((s) => {
      const targetIndex = STATUS_ORDER.indexOf(s);
      return currentIndex >= targetIndex;
    });
  };

  // Helper to check if status is exactly one of the given statuses
  const isExactly = (list: OrderStatus[]): boolean => list.includes(status);

  const getFlowSteps = (): FlowStep[] => {
    const steps: FlowStep[] = [];

    // 1. Nhận đơn (pending)
    steps.push({
      id: "pending",
      label: "Nhận đơn",
      completed: isAtOrPast(["designing"]),
      active: isExactly(["pending"]),
    });

    // 2. Thiết kế (designing, waiting_for_customer_approval, editing)
    steps.push({
      id: "design",
      label: "Thiết kế",
      completed: isAtOrPast(["confirmed_for_printing"]),
      active: isExactly([
        "designing",
        "waiting_for_customer_approval",
        "editing",
      ]),
    });

    // 3. Chốt in (confirmed_for_printing)
    steps.push({
      id: "confirmed",
      label: "Chốt in",
      completed: isAtOrPast([
        "waiting_for_deposit",
        "deposit_received",
        "debt_approved",
        "waiting_for_proofing",
      ]),
      active: isExactly(["confirmed_for_printing"]),
    });

    // 4. Thanh toán - different for retail vs company
    if (customerType === "retail") {
      steps.push({
        id: "payment",
        label: "Đặt cọc",
        completed: hasDeposit || isAtOrPast(["deposit_received"]),
        active: isExactly(["waiting_for_deposit"]),
      });
    } else {
      steps.push({
        id: "payment",
        label: "Duyệt công nợ",
        completed: isAtOrPast(["debt_approved", "waiting_for_proofing"]),
        active: isExactly(["waiting_for_deposit", "deposit_received"]),
      });
    }

    // 5. Bình bài (waiting_for_proofing)
    steps.push({
      id: "proofing",
      label: "Bình bài",
      completed: isAtOrPast(["waiting_for_production"]),
      active: isExactly(["waiting_for_proofing"]),
    });

    // 6. Sản xuất (waiting_for_production, in_production, production_completed)
    steps.push({
      id: "production",
      label: "Sản xuất",
      completed: isAtOrPast(["production_completed"]),
      active: isExactly(["waiting_for_production", "in_production"]),
    });

    // 7. Giao hàng (delivering) - giao hàng trước xuất hóa đơn
    steps.push({
      id: "delivering",
      label: "Giao hàng",
      completed: isAtOrPast(["invoice_issued", "completed"]),
      active: isExactly(["delivering"]),
    });

    // 8. Xuất HĐ (invoice_issued) - có thể xuất nhiều lần
    steps.push({
      id: "invoice",
      label: "Xuất HĐ",
      completed: isAtOrPast(["completed"]),
      active: isExactly(["invoice_issued"]),
    });

    // 9. Hoàn thành (completed)
    steps.push({
      id: "completed",
      label: "Hoàn thành",
      completed: isExactly(["completed"]),
      active: isExactly(["completed"]),
    });

    return steps;
  };

  const steps = getFlowSteps();

  // Handle cancelled status
  if (status === "cancelled") {
    return (
      <Card className="p-5 shadow-card bg-card">
        <h3 className="text-sm font-semibold mb-5 text-muted-foreground uppercase tracking-wide">
          Quy trình đơn hàng
        </h3>
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-3 text-destructive">
            <div className="w-10 h-10 rounded-full bg-destructive/10 border-2 border-destructive flex items-center justify-center">
              <span className="text-lg font-bold">✕</span>
            </div>
            <span className="font-semibold">Đơn hàng đã bị hủy</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 shadow-card bg-card">
      <h3 className="text-sm font-semibold mb-5 text-muted-foreground uppercase tracking-wide">
        Quy trình đơn hàng
      </h3>
      <div className="relative">
        {/* Progress line - desktop */}
        <div className="hidden lg:block absolute top-5 left-0 right-0 h-0.5 bg-border" />
        <div
          className="hidden lg:block absolute top-5 left-0 h-0.5 bg-success transition-all duration-500"
          style={{
            width: `${
              (steps.filter((s) => s.completed).length / steps.length) * 100
            }%`,
          }}
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:gap-0">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center gap-3 lg:flex-col lg:items-center lg:gap-2 lg:flex-1"
            >
              {/* Step indicator */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                  step.completed
                    ? "bg-success border-success text-success-foreground"
                    : step.active
                    ? "bg-primary border-primary text-primary-foreground animate-pulse-soft"
                    : "bg-card border-border text-muted-foreground"
                )}
              >
                {step.completed ? (
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-sm transition-colors lg:text-center lg:mt-1",
                  step.active
                    ? "font-semibold text-foreground"
                    : step.completed
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>

              {/* Mobile connector */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "lg:hidden ml-auto h-0.5 flex-1 max-w-[60px]",
                    step.completed ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
