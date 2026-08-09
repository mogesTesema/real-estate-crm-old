import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  CircleDollarSign,
  Contact2,
  CreditCard,
  FileText,
  FolderKanban,
  GitBranch,
  Globe,
  HelpCircle,
  KanbanSquare,
  KeyRound,
  Layers,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PieChart,
  Plug,
  Radio,
  Receipt,
  Search,
  Settings,
  Shield,
  Target,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Role-aware navigation — grouped per Real-Estate-CRM-Role-Based-Dashboard Designs.md.
 * Locked items (`lockedPhase`) render as disabled stubs until that phase ships.
 * Route guards still use ROUTE_ROLES / canAccess (paths unchanged for live items).
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
  /** Live route; omit when locked. */
  to?: string;
  label: string;
  icon: LucideIcon;
  /** When set, item is shown disabled with a Phase-N lock. */
  lockedPhase?: number;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Flat navigable item (has a real `to`). Used by CommandPalette / guards helpers. */
export interface FlatNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

function item(to: string, label: string, icon: LucideIcon, end?: boolean): NavItem {
  return { to, label, icon, end };
}

function locked(label: string, icon: LucideIcon, phase: number): NavItem {
  return { label, icon, lockedPhase: phase };
}

const OWNER_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [item("/", "Agency Overview", LayoutDashboard, true)],
  },
  {
    label: "Leads",
    items: [
      item("/leads", "All Leads", Users),
      item("/leads/analytics", "Lead Analytics", BarChart3),
      item("/leads/routing", "Auto-Assignment Rules", GitBranch),
      item("/leads/sources", "Lead Sources", Radio),
    ],
  },
  {
    label: "Properties",
    items: [
      item("/properties", "All Listings", Building2),
      item("/properties/analytics", "Inventory Status", PieChart),
      item("/projects", "Projects / Developments", Layers),
      item("/properties/search", "Property Search", Search),
    ],
  },
  {
    label: "Deals & Pipeline",
    items: [
      item("/pipeline", "Pipeline Overview", KanbanSquare),
      item("/pipeline/sales", "Sales Pipeline", TrendingUp),
      item("/pipeline/leasing", "Leasing Pipeline", KeyRound),
      item("/pipeline/forecast", "Forecast", Target),
    ],
  },
  {
    label: "Team",
    items: [
      locked("Agents", Users, 2),
      locked("Agent Performance", BarChart3, 2),
      locked("Branches", Building2, 2),
      locked("Commission Plans", Receipt, 2),
    ],
  },
  {
    label: "Finance",
    items: [
      locked("Transactions", CreditCard, 3),
      locked("Commissions", Receipt, 3),
      locked("Financial Reports", FileText, 3),
      locked("Invoices", FileText, 3),
    ],
  },
  {
    label: "Reports",
    items: [
      item("/reports", "Agency Reports", FolderKanban),
      locked("Agent Leaderboard", Users, 2),
      locked("ROI Reports", PieChart, 2),
      locked("Custom Reports", FileText, 3),
    ],
  },
  {
    label: "Settings",
    items: [item("/settings", "Settings", Settings)],
  },
];

/** Manager sidebar derived from doc 3 (branch reports, routing, KPI, inventory). */
const MANAGER_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [item("/", "Branch Overview", LayoutDashboard, true)],
  },
  {
    label: "Leads",
    items: [
      item("/leads", "All Leads", Users),
      item("/leads/analytics", "KPI / Lead Analytics", BarChart3),
      item("/leads/routing", "Lead Routing Rules", GitBranch),
      item("/leads/sources", "Lead Sources", Radio),
    ],
  },
  {
    label: "Properties",
    items: [
      item("/properties", "Inventory Oversight", Building2),
      item("/properties/analytics", "Listing Analytics", PieChart),
      item("/projects", "Projects", Layers),
      item("/properties/search", "Property Search", Search),
    ],
  },
  {
    label: "Deals & Pipeline",
    items: [
      item("/pipeline", "Pipeline Overview", KanbanSquare),
      item("/pipeline/sales", "Sales Pipeline", TrendingUp),
      item("/pipeline/leasing", "Leasing Pipeline", KeyRound),
      item("/pipeline/forecast", "Forecast", Target),
    ],
  },
  {
    label: "Team",
    items: [
      locked("Broker Management", Users, 2),
      locked("Performance Reviews", BarChart3, 2),
      locked("Commission Oversight", Receipt, 2),
    ],
  },
  {
    label: "Reports",
    items: [
      item("/reports", "Branch Reports", FolderKanban),
      locked("Commission Summaries", Receipt, 2),
    ],
  },
  {
    label: "Settings",
    items: [
      item("/settings", "Branch Settings", Settings),
      locked("Localization / Tax", Globe, 2),
    ],
  },
];

export const ROLE_NAV: Record<RoleKey, NavGroup[]> = {
  super_admin: [
    {
      label: "Dashboard",
      items: [item("/", "Overview", LayoutDashboard, true)],
    },
    {
      label: "Administration",
      items: [
        item("/settings?tab=org", "All Users", Users),
        locked("Roles & Permissions", Shield, 2),
        locked("Companies / Tenants", Building2, 2),
        item("/settings", "System Settings", Settings),
        locked("Audit Log", FileText, 2),
        locked("Data Backup", FolderKanban, 2),
      ],
    },
    {
      label: "CRM",
      items: [
        item("/leads", "Leads", Users),
        item("/contacts", "Contacts", Contact2),
        item("/properties", "Properties", Building2),
        item("/pipeline", "Pipeline", KanbanSquare),
        item("/projects", "Projects", Layers),
      ],
    },
    {
      label: "Reports",
      items: [
        item("/reports", "System Reports", FolderKanban),
        locked("Revenue Reports", CircleDollarSign, 2),
        locked("Usage Analytics", BarChart3, 2),
      ],
    },
    {
      label: "Integrations",
      items: [
        locked("Email Settings", Mail, 2),
        locked("SMS / WhatsApp Settings", MessageSquare, 2),
        locked("API Keys", KeyRound, 2),
        locked("Webhooks", Plug, 2),
      ],
    },
    {
      label: "Subscriptions",
      items: [
        locked("Plans & Pricing", CreditCard, 2),
        locked("Invoices", Receipt, 2),
        locked("Customers", Users, 2),
      ],
    },
    {
      label: "Help & Support",
      items: [
        locked("Documentation", HelpCircle, 3),
        locked("Support Chat", MessageSquare, 3),
        locked("Training Videos", Globe, 3),
      ],
    },
  ],
  owner: OWNER_GROUPS,
  manager: MANAGER_GROUPS,
  agent: [
    {
      label: "Dashboard",
      items: [item("/", "My Performance", LayoutDashboard, true)],
    },
    {
      label: "Leads",
      items: [
        item("/leads", "My Leads", Users),
        item("/leads?filter=hot", "Hot Leads", Target),
        item("/leads?filter=followups", "Follow-ups Due", AlertTriangle),
        item("/leads?new=1", "Add Lead", Users),
      ],
    },
    {
      label: "Contacts",
      items: [
        item("/contacts", "My Contacts", Contact2),
        item("/contacts?new=1", "Add Contact", Contact2),
      ],
    },
    {
      label: "Properties",
      items: [
        item("/properties", "My Listings", Building2),
        item("/properties/search", "Search Properties", Search),
        item("/properties?new=1", "Add Listing", Building2),
      ],
    },
    {
      label: "My Deals",
      items: [
        item("/pipeline", "My Pipeline", KanbanSquare),
        item("/pipeline/sales", "Sales Pipeline", TrendingUp),
        item("/pipeline/leasing", "Leasing Pipeline", KeyRound),
      ],
    },
    {
      label: "Calendar",
      items: [
        locked("My Calendar", Calendar, 2),
        locked("Viewings", Calendar, 2),
        locked("Tasks", Target, 2),
      ],
    },
    {
      label: "Communications",
      items: [
        locked("Email", Mail, 2),
        locked("SMS", MessageSquare, 2),
        locked("WhatsApp", MessageSquare, 2),
        locked("Call Log", MessageSquare, 2),
      ],
    },
    {
      label: "Documents",
      items: [
        locked("My Documents", FileText, 2),
        locked("Templates", FileText, 2),
        locked("Shared Documents", FolderKanban, 2),
      ],
    },
    {
      label: "Reports",
      items: [
        locked("My Performance Report", BarChart3, 2),
        locked("Commission Report", Receipt, 2),
      ],
    },
    {
      label: "Settings",
      items: [item("/settings", "My Profile", Settings)],
    },
  ],
  property_manager: [
    {
      label: "Dashboard",
      items: [item("/", "Portfolio Overview", LayoutDashboard, true)],
    },
    {
      label: "Properties",
      items: [
        item("/properties", "Managed Properties", Building2),
        item("/projects", "Units / Projects", Layers),
        item("/properties/analytics", "Property Status", PieChart),
        item("/properties/search", "Search", Search),
        item("/contacts", "Contacts", Contact2),
      ],
    },
    {
      label: "Leases",
      items: [
        locked("Active Leases", FileText, 2),
        locked("Expiring Soon", Calendar, 2),
        locked("Renewals", FileText, 2),
      ],
    },
    {
      label: "Tenants",
      items: [
        locked("All Tenants", Users, 2),
        locked("Add Tenant", Users, 2),
      ],
    },
    {
      label: "Rent Collection",
      items: [
        locked("Rent Invoices", Receipt, 4),
        locked("Payments", CreditCard, 4),
        locked("Late Payments", AlertTriangle, 4),
      ],
    },
    {
      label: "Maintenance",
      items: [
        locked("Work Orders", Wrench, 2),
        locked("Vendors", Users, 2),
        locked("New Request", Wrench, 2),
      ],
    },
    {
      label: "Reports",
      items: [
        locked("Portfolio Reports", FolderKanban, 2),
        locked("Occupancy Reports", PieChart, 2),
      ],
    },
    {
      label: "Settings",
      items: [item("/settings", "Settings", Settings)],
    },
  ],
  marketing: [
    {
      label: "Dashboard",
      items: [item("/", "Campaign Overview", LayoutDashboard, true)],
    },
    {
      label: "Lead Generation",
      items: [item("/leads/sources", "Lead Sources", Radio)],
    },
    {
      label: "Campaigns",
      items: [
        locked("All Campaigns", Target, 2),
        locked("Active Campaigns", Target, 2),
        locked("New Campaign", Target, 2),
      ],
    },
    {
      label: "Email Marketing",
      items: [
        locked("Templates", Mail, 2),
        locked("Drip Sequences", Mail, 2),
        locked("Open / Click Tracking", BarChart3, 2),
      ],
    },
    {
      label: "Social Media",
      items: [
        locked("Ad Campaigns", Globe, 3),
        locked("Lead Ads Capture", Radio, 3),
      ],
    },
    {
      label: "Website",
      items: [
        locked("Landing Pages", Globe, 3),
        locked("Property Microsites", Building2, 3),
      ],
    },
    {
      label: "Reports",
      items: [
        locked("Marketing Reports", FolderKanban, 2),
        locked("Lead Source ROI", PieChart, 2),
      ],
    },
    {
      label: "Settings",
      items: [item("/settings", "Settings", Settings)],
    },
  ],
  finance: [
    {
      label: "Dashboard",
      items: [item("/", "Financial Overview", LayoutDashboard, true)],
    },
    {
      label: "Commissions",
      items: [
        locked("All Commissions", Receipt, 3),
        locked("Pending Approval", Receipt, 3),
        locked("Paid", CreditCard, 3),
      ],
    },
    {
      label: "Invoices",
      items: [
        locked("All Invoices", FileText, 3),
        locked("Pending Invoices", FileText, 3),
        locked("VAT Reports", FileText, 3),
      ],
    },
    {
      label: "Transactions",
      items: [
        locked("All Transactions", CreditCard, 3),
        locked("Reconciliation", Plug, 3),
      ],
    },
    {
      label: "Reports",
      items: [
        locked("Financial Reports", FolderKanban, 3),
        locked("Profit / Loss", PieChart, 3),
      ],
    },
    {
      label: "Settings",
      items: [item("/settings", "Settings", Settings)],
    },
  ],
  portal: [
    {
      label: "Dashboard",
      items: [item("/", "My Activity", LayoutDashboard, true)],
    },
    {
      label: "Properties",
      items: [
        locked("Saved Searches", Search, 4),
        locked("Match Properties", Building2, 4),
        locked("Favorites", Target, 4),
      ],
    },
    {
      label: "My Deals",
      items: [
        locked("Active Deals", KanbanSquare, 4),
        locked("Offers", FileText, 4),
        locked("Closed Deals", FolderKanban, 4),
      ],
    },
    {
      label: "Documents",
      items: [
        locked("Shared Documents", FileText, 4),
        locked("Contracts", FileText, 4),
      ],
    },
    {
      label: "My Schedule",
      items: [
        locked("Viewings", Calendar, 4),
        locked("Meetings", Calendar, 4),
      ],
    },
    {
      label: "My Lease",
      items: [
        locked("Active Lease", KeyRound, 4),
        locked("Rent Payments", CreditCard, 4),
        locked("Maintenance Requests", Wrench, 4),
      ],
    },
    {
      label: "My Profile",
      items: [item("/settings", "Edit Profile", Settings)],
    },
  ],
};

export function groupsForRole(role: string | undefined): NavGroup[] {
  const r = (role ?? "agent") as RoleKey;
  return ROLE_NAV[r] ?? ROLE_NAV.agent;
}

/** Flat live nav items (skip locked). */
export function navForRole(role: string | undefined): FlatNavItem[] {
  return groupsForRole(role)
    .flatMap((g) => g.items)
    .filter((n): n is NavItem & { to: string } => !!n.to && !n.lockedPhase)
    .map((n) => ({ to: n.to, label: n.label, icon: n.icon, end: n.end }));
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
  const bare = path.split("?")[0];
  const entry = Object.entries(ROUTE_ROLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => bare === prefix || bare.startsWith(prefix + "/"));
  return entry ? entry[1].includes(r) : true;
}

export function isAdminRole(role: string | undefined): boolean {
  return ADMIN_ROLES.includes((role ?? "agent") as RoleKey);
}
