import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = NonNullable<React.ComponentProps<typeof Badge>["variant"]>;

export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto", className)}>{children}</div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  padded = true,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card/60 backdrop-blur-sm",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_8px_24px_-12px_rgba(0,0,0,0.5)]",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-border/70">
          <div>
            {title && <h3 className="text-[13.5px] font-medium tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[11.5px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  delta,
  trend,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
  accent?: boolean;
}) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card/60 backdrop-blur-sm p-5 relative overflow-hidden",
        accent && "border-gold/40",
      )}
    >
      {accent && <div className="absolute inset-x-0 top-0 h-px gold-gradient opacity-60" />}
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div
        className={cn("mt-2 text-display text-[28px] leading-none tabular", accent && "text-gold")}
      >
        {value}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11.5px]">
        {delta && <span className={cn("font-medium tabular", trendColor)}>{delta}</span>}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "gold" | "success" | "warning" | "destructive" | "info" | "outline";
  className?: string;
}) {
  const styles = {
    default: "bg-muted text-foreground/80 border-border",
    gold: "bg-gold/10 text-gold border-gold/30",
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    info: "bg-info/10 text-info border-info/30",
    outline: "bg-transparent text-muted-foreground border-border",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border tracking-wide",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DataTable<T>({
  columns,
  rows,
  onRowClick,
}: {
  columns: {
    key: keyof T | string;
    header: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
    width?: string;
  }[];
  rows: T[];
  onRowClick?: (row: T) => void;
}) {
  const readCellValue = (row: T, key: keyof T | string) => {
    if (typeof row !== "object" || row === null) return undefined;
    return (row as Record<string, React.ReactNode>)[String(key)];
  };

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-left text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground border-b border-border">
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className={cn("px-5 py-3 font-medium", c.className)}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-border/60 hover:bg-accent/40 transition group",
                onRowClick && "cursor-pointer",
              )}
            >
              {columns.map((c) => (
                <td key={String(c.key)} className={cn("px-5 py-3 align-middle", c.className)}>
                  {c.render ? c.render(row) : readCellValue(row, c.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Sparkline({
  data,
  color = "var(--gold)",
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data),
    min = Math.min(...data);
  const range = max - min || 1;
  const w = 120,
    step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");
  return (
    <svg width={w} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      <polygon points={`0,${height} ${points} ${w},${height}`} fill="url(#sparkfill)" />
    </svg>
  );
}
