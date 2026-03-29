import { cn } from "@/lib/utils";
import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ as: Component = "div", className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          "mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Container.displayName = "Container";
