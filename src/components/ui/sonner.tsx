import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme="light"
      className="toaster group"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:border-slate-200 group-[.toaster]:shadow-xl",
          title: "group-[.toast]:text-slate-900 group-data-[type=success]:!text-green-600 group-data-[type=error]:!text-red-600 font-medium",
          description: "group-[.toast]:text-slate-500",
          actionButton: "group-[.toast]:bg-slate-900 group-[.toast]:text-white",
          closeButton:
            "group-[.toast]:bg-white group-[.toast]:text-slate-900 group-[.toast]:border-slate-200 group-[.toast]:hover:bg-slate-50 transition-colors !left-auto !right-2 !top-2",
          success: "!text-green-600",
          error: "!text-red-600",
          icon: "group-data-[type=success]:!text-green-600 group-data-[type=error]:!text-red-600",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
