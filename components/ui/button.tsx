import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-soft",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        outline: "border border-input bg-card text-foreground hover:border-primary/40 hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        soft: "bg-primary-soft text-accent-foreground hover:bg-primary-soft/70",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "rounded-none px-0 text-primary underline-offset-4 hover:underline",
        coffee: "bg-coffee text-white shadow-sm hover:bg-coffee/90",
        gold: "border border-transparent bg-gold text-gold-foreground shadow-sm hover:bg-gold/90 hover:shadow-soft",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        default: "h-10 px-4",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-8",
      },
      shape: {
        pill: "",
        rounded: "rounded-lg",
      },
    },
    compoundVariants: [{ variant: "link", class: "h-auto px-0" }],
    defaultVariants: { variant: "default", size: "default", shape: "pill" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, shape }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
