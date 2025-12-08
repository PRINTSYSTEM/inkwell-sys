import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-5 pr-10 shadow-2xl backdrop-blur-xl transition-all duration-300 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full hover:scale-[1.02] hover:shadow-3xl",
  {
    variants: {
      variant: {
        default: "border-border/50 bg-card/80 text-foreground backdrop-blur-xl",
        destructive:
          "destructive group border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 backdrop-blur-xl shadow-red-500/20",
        success:
          "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400 backdrop-blur-xl shadow-green-500/20",
        warning:
          "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 backdrop-blur-xl shadow-yellow-500/20",
        info: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400 backdrop-blur-xl shadow-blue-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, children, ...props }, ref) => {
  const iconMap = {
    success: (
      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
    ),
    destructive: (
      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
    ),
    warning: (
      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
    ),
    info: (
      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
    ),
    default: null,
  };

  const icon = variant ? iconMap[variant] : null;

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        toastVariants({ variant }),
        "relative overflow-visible",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute -inset-[1px] rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-sm group-hover:opacity-100 transition-opacity duration-300" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent overflow-hidden">
        <div className="h-full w-full origin-left bg-gradient-to-r from-primary/50 via-primary to-primary/50 animate-[toast-progress_5s_linear_forwards] group-[.destructive]:from-red-500/50 group-[.destructive]:via-red-500 group-[.destructive]:to-red-500/50 group-[.success]:from-green-500/50 group-[.success]:via-green-500 group-[.success]:to-green-500/50 group-[.warning]:from-yellow-500/50 group-[.warning]:via-yellow-500 group-[.warning]:to-yellow-500/50 group-[.info]:from-blue-500/50 group-[.info]:via-blue-500 group-[.info]:to-blue-500/50" />
      </div>

      <div className="flex items-start gap-3 flex-1 relative z-10">
        {icon}
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
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background/50 backdrop-blur-sm px-3 text-sm font-medium ring-offset-background transition-all hover:bg-secondary hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-red-500/40 group-[.destructive]:hover:border-red-500/60 group-[.destructive]:hover:bg-red-500/20 group-[.destructive]:hover:text-red-600 group-[.destructive]:focus:ring-red-500",
      className
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
      "absolute right-2 top-2 rounded-md p-1.5 text-foreground/50 opacity-70 backdrop-blur-sm transition-all hover:opacity-100 hover:bg-background/80 hover:text-foreground hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover:opacity-100 group-[.destructive]:text-red-400 group-[.destructive]:hover:text-red-600 group-[.destructive]:hover:bg-red-500/20 group-[.destructive]:focus:ring-red-500",
      className
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
    className={cn("text-sm font-bold text-balance leading-tight", className)}
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
    className={cn("text-sm opacity-80 text-pretty mt-1", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

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
