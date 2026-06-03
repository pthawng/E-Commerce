import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export function SectionNav({
  items,
  active,
}: {
  items: { label: string; to: string; count?: number }[];
  active: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-[12px] transition",
            active === item.to
              ? "border-gold/50 bg-gold/10 text-gold"
              : "border-border bg-surface text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {item.label}
          {typeof item.count === "number" && (
            <span className="text-mono text-[10px] tabular">{item.count}</span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function RiskBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge variant="destructive">Risk {score}</Badge>;
  if (score >= 40) return <Badge variant="warning">Risk {score}</Badge>;
  return <Badge variant="success">Risk {score}</Badge>;
}

export function WorkflowState({ states, active }: { states: string[]; active: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {states.map((state) => (
        <span
          key={state}
          className={cn(
            "rounded border px-2 py-1 text-[10.5px]",
            state === active
              ? "border-gold/50 bg-gold/10 text-gold"
              : "border-border bg-surface text-muted-foreground",
          )}
        >
          {state}
        </span>
      ))}
    </div>
  );
}

export function OpenClientLink({ clientId }: { clientId: string }) {
  return (
    <Link
      to="/vip-care/clients/$clientId"
      params={{ clientId }}
      className="inline-flex items-center text-gold hover:underline"
    >
      <ArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  );
}
