import { ButtonShadcn } from "@/components/ui/shadcn-UI/button";
import { cn } from "@/lib/utils";

interface ButtonIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ElementType;
  size?: number; // optional icon base size
}

export function ButtonIcon({
  icon: Icon,
  size = 20,
  className,
  ...props
}: ButtonIconProps) {
  return (
    <ButtonShadcn
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full text-primary bg-transparent",
        "transition-all duration-200 ease-in-out",
        "hover:bg-button-bg-hover hover:scale-105 hover:shadow-md",
        "cursor-pointer",
        "p-2",
        "border-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",

        /* -------------------------
           RESPONSIVE SIZE
        ------------------------- */
        "h-9 w-9",            // mobile default
        "sm:h-10 sm:w-10",    // tablet
        "md:h-11 md:w-11",    // desktop
        "lg:h-12 lg:w-12",    // large desktop

        className
      )}
      {...props}
    >
      <Icon
        style={{
          width: size,   
          height: size,
        }}
        className={cn(
          "sm:w-[calc(20px*1.1)] md:w-[calc(20px*1.2)] lg:w-[calc(20px*1.3)]",
          "sm:h-[calc(20px*1.1)] md:h-[calc(20px*1.2)] lg:h-[calc(20px*1.3)]"
        )}
      />
    </ButtonShadcn>
  );
}
