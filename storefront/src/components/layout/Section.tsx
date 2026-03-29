import { cn } from "@/lib/utils";
import React from "react";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  padding?: "none" | "sm" | "md" | "lg" | "luxury";
  withHairline?: "top" | "bottom" | "both" | "none";
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      as: Component = "section",
      className,
      padding = "md",
      withHairline = "none",
      children,
      ...props
    },
    ref
  ) => {
    const paddings = {
      none: "py-0",
      sm: "py-8 sm:py-12",
      md: "py-16 sm:py-24",
      lg: "py-24 sm:py-32",
      luxury: "py-32 sm:py-48",
    };

    return (
      <Component
        ref={ref}
        className={cn(
          "relative w-full",
          paddings[padding],
          withHairline === "top" || withHairline === "both" ? "border-t border-hairline" : "",
          withHairline === "bottom" || withHairline === "both" ? "border-b border-hairline" : "",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Section.displayName = "Section";
