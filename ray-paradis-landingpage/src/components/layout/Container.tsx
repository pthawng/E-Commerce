import { cn } from "@/lib/utils";
import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export const Container = ({
  as: Component = "div",
  className,
  children,
  ...props
}: ContainerProps) => {
  return (
    <Component
      className={cn(
        "mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
