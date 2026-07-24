import { cn } from "@/lib/utils";

export function AspinoIcon({ className, size = 36 }) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden flex items-center justify-center select-none",
        className
      )}
      style={{ width: size, height: size }}
    >
      <img
        src="/aspino-icon.png"
        alt="Aspino"
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export function AspinoLogo({
  className,
  size = "default",
  showText = true,
  subtitle = "Pharma ERP",
}) {
  const iconSizes = {
    xs: 24,
    sm: 30,
    default: 36,
    lg: 48,
    xl: 64,
  };

  const iconSize = iconSizes[size] || iconSizes.default;

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <AspinoIcon size={iconSize} />
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-aspino-primary to-aspino-secondary bg-clip-text text-transparent">
            ASPINO
          </span>
          {subtitle && (
            <span className="text-[10px] font-medium text-muted-foreground tracking-tight leading-tight mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
