import { Building2 } from "lucide-react";

import { useAuth } from "../lib/auth";
import { useList } from "../lib/hooks";
import { ROLE_LABELS, type RoleKey } from "../lib/roles";

interface Branch {
  id: string;
  name: string;
}

/**
 * Global header indicator of *where* the user is scoped (design system §1B).
 * Manager → their branch. Agent → own records. Owner/admin → whole company.
 */
export function ScopeBadge() {
  const { me } = useAuth();
  const role = (me?.role ?? "agent") as RoleKey;
  const branches = useList<Branch>("branches", { page_size: 100 });

  let label: string;
  if (role === "manager" && me?.branch) {
    const branch = branches.data?.results?.find((b) => b.id === me.branch);
    label = `Branch: ${branch?.name ?? "…"}`;
  } else if (role === "agent") {
    label = "Scope: My records";
  } else if (role === "owner" || role === "super_admin") {
    label = "Scope: Company-wide";
  } else {
    label = ROLE_LABELS[role] ?? "Scoped view";
  }

  return (
    <span className="hidden items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground lg:inline-flex">
      <Building2 className="size-3.5" />
      {label}
    </span>
  );
}
