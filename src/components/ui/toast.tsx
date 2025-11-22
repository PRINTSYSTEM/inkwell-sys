import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider: React.FC<
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Provider>
> = ({ children, ...props }) => (
  <ToastPrimitives.Provider
    duration={10000}          // default 10s cho mọi toast
    swipeDirection="right"
    {...props}
  >
    {children}
  </ToastPrimitives.Provider>
);

ToastProvider.displayName = "ToastProvider";

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // hàng dọc, xếp chồng, cái mới nằm dưới
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col gap-3 p-4 sm:right-0 sm:top-0 sm:w-auto sm:items-end md:top-4",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// ---- NEW: type ToastProps riêng để thêm duration ----
type BaseToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>;
type ToastProps = BaseToastProps & VariantProps<typeof toastVariants> & {
  duration?: number;
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, variant, duration, children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      duration={duration ?? 10000}
      className={cn(toastVariants({ variant }), "overflow-visible", className)}
      {...props}
    >
      {/* Vòng viền mờ bên ngoài */}
      <div className="pointer-events-none absolute -inset-[1px] rounded-md border border-primary/20 group-[.destructive]:border-destructive/40" />

      {/* Thanh tiến trình 10s phía trên */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-primary/10 group-[.destructive]:bg-destructive/20">
        <div className="h-full w-full origin-left bg-primary group-[.destructive]:bg-destructive animate-[toast-progress_10s_linear_forwards]" />
      </div>

      {/* Vòng tròn đếm ngược 10s ở góc trái dưới */}
      <div className="pointer-events-none absolute bottom-2 left-2">
        <svg
          viewBox="0 0 36 36"
          className="-rotate-90 h-5 w-5 text-primary group-[.destructive]:text-destructive"
        >
          {/* vòng nền */}
          <circle
            className="text-muted-foreground/30 stroke-current"
            strokeWidth="3"
            fill="transparent"
            r="16"
            cx="18"
            cy="18"
          />
          {/* vòng countdown */}
          <circle
            className="stroke-current animate-[toast-ring_10s_linear_forwards]"
            strokeWidth="3"
            fill="transparent"
            r="16"
            cx="18"
            cy="18"
            style={{
              strokeDasharray: 100,
              strokeDashoffset: 100,
            }}
          />
        </svg>
      </div>

      {/* Nội dung chính đẩy ra một chút để không đè lên vòng tròn */}
      <div className="flex w-full items-start justify-between pl-8">
        <div className="flex-1">{children}</div>
      </div>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors group-[.destructive]:border-muted/40 hover:bg-secondary group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group-[.destructive]:focus:ring-destructive disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-foreground group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:outline-none focus:ring-2 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
