import { ButtonShadcn } from "@/components/ui/shadcn-UI/button";
import { cn } from "@/lib/utils";

interface ButtonIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ElementType;
  size?: number;
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
        "text-primary",
        "inline-flex items-center justify-center",
        "cursor-pointer",
        "transition-transform duration-200 ease-in-out",
        "hover:-translate-y-1",
        className
      )}
      {...props}
    >
      <Icon
        style={{
          width: size,
          height: size,
        }}
      />
    </ButtonShadcn>
  );
}
