import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { PageHeader } from "./PageHeader";
import { StatCard } from "./StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import type { Tone } from "../lib/status";

export interface ModuleStat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  loading?: boolean;
}

export function ModuleDashboard({
  title,
  description,
  stats,
  children,
  actions,
}: {
  title: string;
  description?: string;
  stats: ModuleStat[];
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} actions={actions} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            tone={s.tone ?? "muted"}
            loading={s.loading}
          />
        ))}
      </div>
      {children && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
}

export function Panel({
  title,
  children,
  loading,
}: {
  title: string;
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
