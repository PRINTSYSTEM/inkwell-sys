import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          closeButton:
            "group-[.toast]:bg-background group-[.toast]:text-primary group-[.toast]:border-border group-[.toast]:hover:bg-muted group-[.toast]:hover:text-primary transition-colors !left-auto !right-2 !top-2",
          success: "group-[.toast]:text-green-600",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
