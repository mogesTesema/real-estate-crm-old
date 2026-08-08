import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "../lib/cn";

type EntityAccent = "lead" | "property" | "deal" | "lease" | "finance" | "muted";

const accentClass: Record<EntityAccent, string> = {
  lead: "bg-entity-lead/15 text-entity-lead",
  property: "bg-entity-property/15 text-entity-property",
  deal: "bg-entity-deal/15 text-entity-deal",
  lease: "bg-entity-lease/15 text-entity-lease",
  finance: "bg-entity-finance/15 text-entity-finance",
  muted: "bg-muted text-muted-foreground",
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  entity = "muted",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Entity accent for the empty-state icon (doc 1 entity accents). */
  entity?: EntityAccent;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
      <div
        className={cn(
          "mb-3 flex size-12 items-center justify-center rounded-full",
          accentClass[entity],
        )}
      >
        <Icon className="size-6" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
