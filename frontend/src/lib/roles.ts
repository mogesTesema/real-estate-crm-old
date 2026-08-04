import {
  BarChart3,
  Building2,
  Contact2,
  FolderKanban,
  GitBranch,
  KanbanSquare,
  Layers,
  LayoutDashboard,
  PieChart,
  Radio,
  Search,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Role-aware navigation (frontend plan §6). One config drives every role's
 * sidebar; items are filtered by the signed-in user's role. Phase 1 items
 * only — Phase 2+ modules are added here as they ship.
 */
export type RoleKey =
  | "super_admin"
  | "owner"
  | "manager"
  | "agent"
  | "property_manager"
  | "marketing"
  | "finance"
  | "portal";

export const ROLE_LABELS: Record<RoleKey, string> = {
  super_admin: "Super Admin",
  owner: "Broker / Owner",
  manager: "Branch / Team Manager",
  agent: "Sales / Leasing Agent",
  property_manager: "Property Manager",
  marketing: "Marketing",
  finance: "Finance",
  portal: "Portal User",
};

export const ALL_ROLES = Object.keys(ROLE_LABELS) as RoleKey[];

/** Sales org roles — full CRM access. */
export const SALES_ROLES: RoleKey[] = ["super_admin", "owner", "manager", "agent"];
/** Roles that manage people/config (branch or agency admins). */
export const ADMIN_ROLES: RoleKey[] = ["super_admin", "owner", "manager"];

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: RoleKey[];
  /** Sidebar group heading this item renders under. */
  section: "Overview" | "CRM" | "Insights" | "System";
  end?: boolean;
}

export const NAV: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ALL_ROLES,
    section: "Overview",
    end: true,
  },
  {
    to: "/leads",
    label: "Leads",
    icon: Users,
    roles: SALES_ROLES,
    section: "CRM",
  },
  {
    to: "/leads/routing",
    label: "Lead routing",
    icon: GitBranch,
    roles: ADMIN_ROLES,
    section: "CRM",
  },
  {
    to: "/leads/sources",
    label: "Lead sources",
    icon: Radio,
    roles: ["super_admin", "owner", "manager", "marketing"],
    section: "CRM",
  },
  {
    to: "/contacts",
    label: "Contacts",
    icon: Contact2,
    roles: [...SALES_ROLES, "property_manager"],
    section: "CRM",
  },
  {
    to: "/properties",
    label: "Properties",
    icon: Building2,
    roles: [...SALES_ROLES, "property_manager"],
    section: "CRM",
  },
  {
    to: "/properties/search",
    label: "Property search",
    icon: Search,
    roles: [...SALES_ROLES, "property_manager"],
    section: "CRM",
  },
  {
    to: "/projects",
    label: "Projects",
    icon: Layers,
    roles: ["super_admin", "owner", "manager", "property_manager"],
    section: "CRM",
  },
  {
    to: "/pipeline",
    label: "Pipeline",
    icon: KanbanSquare,
    roles: SALES_ROLES,
    section: "CRM",
  },
  {
    to: "/leads/analytics",
    label: "Lead Analytics",
    icon: BarChart3,
    roles: ADMIN_ROLES,
    section: "Insights",
  },
  {
    to: "/properties/analytics",
    label: "Listing Analytics",
    icon: PieChart,
    roles: ADMIN_ROLES,
    section: "Insights",
  },
  {
    to: "/pipeline/forecast",
    label: "Forecast",
    icon: TrendingUp,
    roles: ADMIN_ROLES,
    section: "Insights",
  },
  {
    to: "/reports",
    label: "Reports",
    icon: FolderKanban,
    roles: ADMIN_ROLES,
    section: "Insights",
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    roles: ALL_ROLES,
    section: "System",
  },
];

export function navForRole(role: string | undefined): NavItem[] {
  const r = (role ?? "agent") as RoleKey;
  return NAV.filter((n) => n.roles.includes(r));
}

/** Route prefix → allowed roles (frontend route guard). */
export const ROUTE_ROLES: Record<string, RoleKey[]> = {
  "/leads": SALES_ROLES,
  "/contacts": [...SALES_ROLES, "property_manager"],
  "/properties": [...SALES_ROLES, "property_manager"],
  "/projects": ["super_admin", "owner", "manager", "property_manager"],
  "/pipeline": SALES_ROLES,
  "/reports": ADMIN_ROLES,
  "/settings": ALL_ROLES,
};

export function canAccess(role: string | undefined, path: string): boolean {
  if (path === "/403" || path === "/404" || path === "/onboarding") return true;
  const r = (role ?? "agent") as RoleKey;
  // Narrower admin-only lead subroutes.
  if (path.startsWith("/leads/routing") || path.startsWith("/leads/analytics")) {
    return ADMIN_ROLES.includes(r);
  }
  if (path.startsWith("/leads/sources")) {
    return (["super_admin", "owner", "manager", "marketing"] as RoleKey[]).includes(r);
  }
  const entry = Object.entries(ROUTE_ROLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => path === prefix || path.startsWith(prefix + "/"));
  return entry ? entry[1].includes(r) : true;
}

export function isAdminRole(role: string | undefined): boolean {
  return ADMIN_ROLES.includes((role ?? "agent") as RoleKey);
}
