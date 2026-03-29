import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-body font-medium tracking-wider uppercase ring-offset-background transition-all duration-500 ease-luxury focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-luxury hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-primary/20 bg-transparent text-primary hover:bg-primary/5 hover:border-primary/40",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "text-primary/70 hover:bg-primary/5 hover:text-primary transition-colors",
        link: "text-primary underline-offset-4 hover:underline",
        luxury: "relative isolate overflow-hidden border border-primary/30 bg-transparent text-primary before:absolute before:inset-0 before:-translate-x-full before:bg-primary before:transition-transform before:duration-700 before:z-[-1] hover:text-primary-foreground hover:border-primary hover:before:translate-x-0",
        "luxury-light": "relative isolate overflow-hidden border border-white/40 bg-transparent text-white before:absolute before:inset-0 before:-translate-x-full before:bg-white before:transition-transform before:duration-700 before:z-[-1] hover:text-primary hover:border-white hover:before:translate-x-0",
        "ghost-minimal": "text-muted-foreground hover:text-foreground",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 rounded-lg text-[10px]",
        lg: "h-14 px-10 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
