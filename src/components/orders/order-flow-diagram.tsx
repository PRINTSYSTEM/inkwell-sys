import { Card } from "@/components/ui/card";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus =
  | "pending"
  | "waiting_for_proofing"
  | "proofed"
  | "waiting_for_production"
  | "in_production"
  | "completed"
  | "invoice_issued"
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

export function OrderFlowDiagram({
  currentStatus,
  customerType,
  hasDeposit,
}: OrderFlowDiagramProps) {
  const status = (currentStatus || "") as OrderStatus;
  const is = (list: OrderStatus[]) => list.includes(status);

  const getFlowSteps = (): FlowStep[] => {
    const steps: FlowStep[] = [];

    steps.push({
      id: "pending",
      label: "Nhận đơn",
      completed: is([
        "waiting_for_proofing",
        "proofed",
        "waiting_for_production",
        "in_production",
        "completed",
        "invoice_issued",
      ]),
      active: status === "pending",
    });

    steps.push({
      id: "design",
      label: "Thiết kế",
      completed: is([
        "waiting_for_proofing",
        "proofed",
        "waiting_for_production",
        "in_production",
        "completed",
        "invoice_issued",
      ]),
      active: is(["pending"]),
    });

    if (customerType === "retail") {
      steps.push({
        id: "deposited",
        label: "Nhận cọc",
        completed: hasDeposit,
        active: !hasDeposit && is(["pending", "waiting_for_proofing"]),
      });
    }

    steps.push({
      id: "proofing",
      label: "Bình bài",
      completed: is([
        "waiting_for_production",
        "in_production",
        "completed",
        "invoice_issued",
      ]),
      active: is(["waiting_for_proofing", "proofed"]),
    });

    steps.push({
      id: "production",
      label: "Sản xuất",
      completed: is(["completed", "invoice_issued"]),
      active: is(["waiting_for_production", "in_production"]),
    });

    steps.push({
      id: "completed",
      label: "Hoàn thành",
      completed: is(["invoice_issued"]),
      active: status === "completed",
    });

    steps.push({
      id: "invoice",
      label: "Xuất HĐ",
      completed: status === "invoice_issued",
      active: status === "invoice_issued",
    });

    return steps;
  };

  const steps = getFlowSteps();

  return (
    <Card className="p-5 shadow-card bg-card">
      <h3 className="text-sm font-semibold mb-5 text-muted-foreground uppercase tracking-wide">
        Quy trình đơn hàng
      </h3>
      <div className="relative">
        {/* Progress line */}
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
