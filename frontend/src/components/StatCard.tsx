import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { cn } from "../lib/cn";
import { type Tone } from "../lib/status";

const tileClasses: Record<Tone, string> = {
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  destructive: "bg-destructive-subtle text-destructive",
  info: "bg-info-subtle text-info",
  primary: "bg-primary-subtle text-primary",
  muted: "bg-muted text-muted-foreground",
};

/**
 * KPI stat card (frontend plan §5). Icon tile tinted by semantic tone.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  loading,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  hint?: ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg",
            tileClasses[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="truncate text-2xl font-semibold tabular">{value}</div>
          )}
          <div className="truncate text-sm text-muted-foreground">{label}</div>
          {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
