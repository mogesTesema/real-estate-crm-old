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
 * Every item is a live route (no locked stubs) for the mentor frontend showcase.
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

export const SALES_ROLES: RoleKey[] = ["super_admin", "owner", "manager", "agent"];
export const ADMIN_ROLES: RoleKey[] = ["super_admin", "owner", "manager"];

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface FlatNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

function item(to: string, label: string, icon: LucideIcon, end?: boolean): NavItem {
  return { to, label, icon, end };
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
      item("/team/agents", "Agents", Users),
      item("/team/performance", "Agent Performance", BarChart3),
      item("/team/branches", "Branches", Building2),
      item("/team/commission-plans", "Commission Plans", Receipt),
    ],
  },
  {
    label: "Finance",
    items: [
      item("/finance/transactions", "Transactions", CreditCard),
      item("/finance/commissions", "Commissions", Receipt),
      item("/finance/reports", "Financial Reports", FileText),
      item("/finance/invoices", "Invoices", FileText),
    ],
  },
  {
    label: "Reports",
    items: [
      item("/reports", "Agency Reports", FolderKanban),
      item("/reports/leaderboard", "Agent Leaderboard", Users),
      item("/reports/roi", "ROI Reports", PieChart),
      item("/reports/custom", "Custom Reports", FileText),
    ],
  },
  {
    label: "Settings",
    items: [item("/settings", "Settings", Settings)],
  },
];

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
      item("/team/agents", "Broker Management", Users),
      item("/team/performance", "Performance Reviews", BarChart3),
      item("/finance/commissions", "Commission Oversight", Receipt),
    ],
  },
  {
    label: "Reports",
    items: [
      item("/reports", "Branch Reports", FolderKanban),
      item("/finance/reports/commission", "Commission Summaries", Receipt),
    ],
  },
  {
    label: "Settings",
    items: [
      item("/settings", "Branch Settings", Settings),
      item("/settings?tab=org", "Localization / Tax", Globe),
    ],
  },
];

export const ROLE_NAV: Record<RoleKey, NavGroup[]> = {
  super_admin: [
    {
      label: "Dashboard",
      items: [
        item("/", "Overview", LayoutDashboard, true),
        item("/admin/analytics", "System Analytics", BarChart3),
      ],
    },
    {
      label: "Administration",
      items: [
        item("/admin/users", "All Users", Users),
        item("/admin/roles", "Roles & Permissions", Shield),
        item("/admin/tenants", "Companies / Tenants", Building2),
        item("/settings", "System Settings", Settings),
        item("/admin/audit", "Audit Log", FileText),
        item("/admin/backup", "Data Backup", FolderKanban),
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
        item("/admin/reports/revenue", "Revenue Reports", CircleDollarSign),
        item("/admin/reports/usage", "Usage Analytics", BarChart3),
      ],
    },
    {
      label: "Integrations",
      items: [
        item("/admin/integrations/email", "Email Settings", Mail),
        item("/admin/integrations/sms", "SMS / WhatsApp Settings", MessageSquare),
        item("/admin/integrations/api-keys", "API Keys", KeyRound),
        item("/admin/integrations/webhooks", "Webhooks", Plug),
      ],
    },
    {
      label: "Subscriptions",
      items: [
        item("/admin/subscriptions/plans", "Plans & Pricing", CreditCard),
        item("/admin/subscriptions/invoices", "Invoices", Receipt),
        item("/admin/subscriptions/customers", "Customers", Users),
      ],
    },
    {
      label: "Help & Support",
      items: [
        item("/help/docs", "Documentation", HelpCircle),
        item("/help/chat", "Support Chat", MessageSquare),
        item("/help/training", "Training Videos", Globe),
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
        item("/contacts?role=buyer", "Buyers", Users),
        item("/contacts?role=seller", "Sellers", Users),
        item("/contacts?role=tenant", "Tenants", Users),
        item("/contacts?new=1", "Add Contact", Contact2),
      ],
    },
    {
      label: "Properties",
      items: [
        item("/properties", "My Listings", Building2),
        item("/properties/search", "Search Properties", Search),
        item("/projects", "Project Units", Layers),
        item("/properties?new=1", "Add Listing", Building2),
      ],
    },
    {
      label: "My Deals",
      items: [
        item("/pipeline", "My Pipeline", KanbanSquare),
        item("/pipeline/sales", "Sales Pipeline", TrendingUp),
        item("/pipeline/leasing", "Leasing Pipeline", KeyRound),
        item("/pipeline?status=won", "Won Deals", Target),
        item("/pipeline?status=lost", "Lost Deals", AlertTriangle),
      ],
    },
    {
      label: "Calendar",
      items: [
        item("/calendar", "My Calendar", Calendar),
        item("/calendar?type=viewing", "Viewings", Calendar),
        item("/calendar?type=task", "Tasks", Target),
        item("/calendar?new=1", "Add Event", Calendar),
      ],
    },
    {
      label: "Communications",
      items: [
        item("/comms?channel=email", "Email", Mail),
        item("/comms?channel=sms", "SMS", MessageSquare),
        item("/comms?channel=whatsapp", "WhatsApp", MessageSquare),
        item("/comms?channel=call", "Call Log", MessageSquare),
        item("/comms/templates", "Message Templates", FileText),
      ],
    },
    {
      label: "Documents",
      items: [
        item("/documents", "My Documents", FileText),
        item("/documents?type=template", "Templates", FileText),
        item("/documents?shared=1", "Shared Documents", FolderKanban),
      ],
    },
    {
      label: "Reports",
      items: [
        item("/reports/my-performance", "My Performance Report", BarChart3),
        item("/reports/my-commission", "Commission Report", Receipt),
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
        item("/leases", "Active Leases", FileText),
        item("/leases?status=expiring", "Expiring Soon", Calendar),
        item("/leases?status=renewed", "Renewals", FileText),
        item("/leases?status=terminated", "Terminations", AlertTriangle),
      ],
    },
    {
      label: "Tenants",
      items: [
        item("/tenants", "All Tenants", Users),
        item("/tenants?new=1", "Add Tenant", Users),
      ],
    },
    {
      label: "Rent Collection",
      items: [
        item("/rent/invoices", "Rent Invoices", Receipt),
        item("/rent/payments", "Payments", CreditCard),
        item("/rent/reports", "Rent Reports", BarChart3),
        item("/rent/late", "Late Payments", AlertTriangle),
      ],
    },
    {
      label: "Maintenance",
      items: [
        item("/maintenance", "Work Orders", Wrench),
        item("/maintenance/vendors", "Vendors", Users),
        item("/maintenance/reports", "Maintenance Reports", FolderKanban),
        item("/maintenance?new=1", "New Request", Wrench),
      ],
    },
    {
      label: "Reports",
      items: [
        item("/reports/portfolio", "Portfolio Reports", FolderKanban),
        item("/reports/occupancy", "Occupancy Reports", PieChart),
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
        item("/marketing/campaigns", "All Campaigns", Target),
        item("/marketing/campaigns?status=active", "Active Campaigns", Target),
        item("/marketing/campaigns?new=1", "New Campaign", Target),
      ],
    },
    {
      label: "Email Marketing",
      items: [
        item("/marketing/email/templates", "Templates", Mail),
        item("/marketing/email/drip", "Drip Sequences", Mail),
        item("/marketing/email/tracking", "Open / Click Tracking", BarChart3),
      ],
    },
    {
      label: "Social Media",
      items: [
        item("/marketing/social", "Ad Campaigns", Globe),
        item("/marketing/social/leads", "Lead Ads Capture", Radio),
      ],
    },
    {
      label: "Website",
      items: [
        item("/marketing/website/landing", "Landing Pages", Globe),
        item("/marketing/website/microsites", "Property Microsites", Building2),
        item("/marketing/website/analytics", "Website Analytics", BarChart3),
      ],
    },
    {
      label: "Reports",
      items: [
        item("/marketing/reports", "Marketing Reports", FolderKanban),
        item("/marketing/reports/roi", "Lead Source ROI", PieChart),
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
        item("/finance/commissions", "All Commissions", Receipt),
        item("/finance/commissions?status=pending_approval", "Pending Approval", Receipt),
        item("/finance/commissions?status=paid", "Paid", CreditCard),
      ],
    },
    {
      label: "Invoices",
      items: [
        item("/finance/invoices", "All Invoices", FileText),
        item("/finance/invoices?status=issued", "Pending Invoices", FileText),
        item("/finance/vat", "VAT Reports", FileText),
      ],
    },
    {
      label: "Transactions",
      items: [
        item("/finance/transactions", "All Transactions", CreditCard),
        item("/finance/milestones", "Payment Milestones", Target),
        item("/finance/reconciliation", "Reconciliation", Plug),
      ],
    },
    {
      label: "Reports",
      items: [
        item("/finance/reports", "Financial Reports", FolderKanban),
        item("/finance/reports/commission", "Commission Summary", Receipt),
        item("/finance/vat", "VAT Summary", FileText),
        item("/finance/reports/pnl", "Profit / Loss", PieChart),
      ],
    },
    {
      label: "Integrations",
      items: [
        item("/finance/integrations/export", "Accounting Export", Plug),
        item("/finance/reconciliation", "Reconciliation Tools", Plug),
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
        item("/portal/searches", "Saved Searches", Search),
        item("/portal/matches", "Match Properties", Building2),
        item("/portal/favorites", "Favorites", Target),
      ],
    },
    {
      label: "My Deals",
      items: [
        item("/portal/deals", "Active Deals", KanbanSquare),
        item("/portal/offers", "Offers", FileText),
        item("/portal/deals?status=closed", "Closed Deals", FolderKanban),
      ],
    },
    {
      label: "Documents",
      items: [
        item("/portal/documents", "Shared Documents", FileText),
        item("/portal/documents?type=contract", "Contracts", FileText),
      ],
    },
    {
      label: "My Schedule",
      items: [
        item("/portal/schedule?type=viewing", "Viewings", Calendar),
        item("/portal/schedule?type=meeting", "Meetings", Calendar),
      ],
    },
    {
      label: "My Lease",
      items: [
        item("/portal/lease", "Active Lease", KeyRound),
        item("/portal/lease/payments", "Rent Payments", CreditCard),
        item("/portal/lease/maintenance", "Maintenance Requests", Wrench),
        item("/portal/lease/documents", "Lease Documents", FileText),
      ],
    },
    {
      label: "My Property",
      items: [
        item("/portal/landlord/properties", "Listed Properties", Building2),
        item("/portal/landlord/performance", "Performance Reports", BarChart3),
        item("/portal/landlord/statements", "Rent Statements", Receipt),
        item("/portal/landlord/leases", "Lease Management", FileText),
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

export function navForRole(role: string | undefined): FlatNavItem[] {
  return groupsForRole(role).flatMap((g) =>
    g.items.map((n) => ({ to: n.to, label: n.label, icon: n.icon, end: n.end })),
  );
}

/**
 * Explicit route → allowed roles. Most-specific path wins; unknown paths default deny.
 * Keep in sync with App.tsx routes and ROLE_NAV.
 */
export const ROUTE_ROLES: Record<string, RoleKey[]> = {
  "/": ALL_ROLES,
  "/403": ALL_ROLES,
  "/404": ALL_ROLES,
  "/onboarding": ALL_ROLES,

  "/leads": [...SALES_ROLES, "marketing"],
  "/leads/analytics": ADMIN_ROLES,
  "/leads/routing": ADMIN_ROLES,
  "/leads/sources": ["super_admin", "owner", "manager", "marketing"],

  "/contacts": [...SALES_ROLES, "property_manager"],
  "/contacts/import": [...SALES_ROLES, "property_manager"],

  "/properties": [...SALES_ROLES, "property_manager"],
  "/properties/search": [...SALES_ROLES, "property_manager"],
  "/properties/analytics": [...SALES_ROLES, "property_manager"],

  "/projects": ["super_admin", "owner", "manager", "property_manager", "agent"],

  "/pipeline": SALES_ROLES,
  "/pipeline/sales": SALES_ROLES,
  "/pipeline/leasing": SALES_ROLES,
  "/pipeline/forecast": SALES_ROLES,

  "/reports": ["super_admin", "owner", "manager"],
  "/reports/my-performance": ["agent"],
  "/reports/my-commission": ["agent"],
  "/reports/leaderboard": ["super_admin", "owner", "manager"],
  "/reports/roi": ["super_admin", "owner"],
  "/reports/custom": ["super_admin", "owner"],
  "/reports/portfolio": ["property_manager", "owner", "manager", "super_admin"],
  "/reports/occupancy": ["property_manager", "owner", "manager", "super_admin"],

  "/settings": ALL_ROLES,

  "/calendar": ["agent", "owner", "manager", "super_admin"],
  "/comms": ["agent", "owner", "manager", "super_admin"],
  "/comms/templates": ["agent", "owner", "manager", "super_admin"],
  "/documents": ["agent", "owner", "manager", "super_admin", "property_manager"],

  "/team": ["owner", "manager", "super_admin"],
  "/team/agents": ["owner", "manager", "super_admin"],
  "/team/performance": ["owner", "manager", "super_admin"],
  "/team/branches": ["owner", "super_admin"],
  "/team/commission-plans": ["owner", "super_admin"],

  "/leases": ["property_manager", "owner", "manager", "super_admin"],
  "/tenants": ["property_manager", "owner", "manager", "super_admin"],

  "/rent": ["property_manager", "owner", "finance", "super_admin"],
  "/rent/invoices": ["property_manager", "owner", "finance", "super_admin"],
  "/rent/payments": ["property_manager", "owner", "finance", "super_admin"],
  "/rent/reports": ["property_manager", "owner", "finance", "super_admin"],
  "/rent/late": ["property_manager", "owner", "finance", "super_admin"],

  "/maintenance": ["property_manager", "owner", "manager", "super_admin"],
  "/maintenance/vendors": ["property_manager", "owner", "manager", "super_admin"],
  "/maintenance/reports": ["property_manager", "owner", "manager", "super_admin"],

  "/marketing": ["marketing", "owner", "super_admin"],
  "/marketing/campaigns": ["marketing", "owner", "super_admin"],
  "/marketing/email/templates": ["marketing", "owner", "super_admin"],
  "/marketing/email/drip": ["marketing", "owner", "super_admin"],
  "/marketing/email/tracking": ["marketing", "owner", "super_admin"],
  "/marketing/social": ["marketing", "owner", "super_admin"],
  "/marketing/social/leads": ["marketing", "owner", "super_admin"],
  "/marketing/website/landing": ["marketing", "owner", "super_admin"],
  "/marketing/website/microsites": ["marketing", "owner", "super_admin"],
  "/marketing/website/analytics": ["marketing", "owner", "super_admin"],
  "/marketing/reports": ["marketing", "owner", "super_admin"],
  "/marketing/reports/roi": ["marketing", "owner", "super_admin"],

  "/finance/commissions": ["finance", "owner", "manager", "super_admin"],
  "/finance/reports/commission": ["finance", "owner", "manager", "super_admin"],
  "/finance/invoices": ["finance", "owner", "super_admin"],
  "/finance/vat": ["finance", "owner", "super_admin"],
  "/finance/transactions": ["finance", "owner", "super_admin"],
  "/finance/milestones": ["finance", "owner", "super_admin"],
  "/finance/reconciliation": ["finance", "owner", "super_admin"],
  "/finance/reports": ["finance", "owner", "super_admin"],
  "/finance/reports/pnl": ["finance", "owner", "super_admin"],
  "/finance/integrations/export": ["finance", "owner", "super_admin"],

  "/portal": ["portal"],
  "/portal/searches": ["portal"],
  "/portal/matches": ["portal"],
  "/portal/favorites": ["portal"],
  "/portal/deals": ["portal"],
  "/portal/offers": ["portal"],
  "/portal/documents": ["portal"],
  "/portal/schedule": ["portal"],
  "/portal/lease": ["portal"],
  "/portal/lease/payments": ["portal"],
  "/portal/lease/maintenance": ["portal"],
  "/portal/lease/documents": ["portal"],
  "/portal/landlord/properties": ["portal"],
  "/portal/landlord/performance": ["portal"],
  "/portal/landlord/statements": ["portal"],
  "/portal/landlord/leases": ["portal"],

  "/admin": ["super_admin"],
  "/admin/analytics": ["super_admin"],
  "/admin/users": ["super_admin"],
  "/admin/roles": ["super_admin"],
  "/admin/tenants": ["super_admin"],
  "/admin/audit": ["super_admin"],
  "/admin/backup": ["super_admin"],
  "/admin/reports/revenue": ["super_admin"],
  "/admin/reports/usage": ["super_admin"],
  "/admin/integrations/email": ["super_admin"],
  "/admin/integrations/sms": ["super_admin"],
  "/admin/integrations/api-keys": ["super_admin"],
  "/admin/integrations/webhooks": ["super_admin"],
  "/admin/subscriptions/plans": ["super_admin"],
  "/admin/subscriptions/invoices": ["super_admin"],
  "/admin/subscriptions/customers": ["super_admin"],

  "/help": ALL_ROLES,
  "/help/docs": ALL_ROLES,
  "/help/chat": ALL_ROLES,
  "/help/training": ALL_ROLES,
};

export function canAccess(role: string | undefined, path: string): boolean {
  const bare = (path.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  if (bare === "/403" || bare === "/404" || bare === "/onboarding") return true;
  const r = (role ?? "agent") as RoleKey;

  // Dynamic property detail: /properties/:id
  if (/^\/properties\/[^/]+$/.test(bare) && bare !== "/properties/search" && bare !== "/properties/analytics") {
    return (["super_admin", "owner", "manager", "agent", "property_manager"] as RoleKey[]).includes(r);
  }

  const entry = Object.entries(ROUTE_ROLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => bare === prefix || bare.startsWith(prefix + "/"));
  return entry ? entry[1].includes(r) : false;
}

export function isAdminRole(role: string | undefined): boolean {
  return ADMIN_ROLES.includes((role ?? "agent") as RoleKey);
}

/** Demo logins for mentor showcase (password: demo12345). */
export const DEMO_LOGINS: { email: string; role: RoleKey; label: string }[] = [
  { email: "superadmin@demo.test", role: "super_admin", label: "Super Admin" },
  { email: "owner@demo.test", role: "owner", label: "Broker / Owner" },
  { email: "manager@demo.test", role: "manager", label: "Branch Manager" },
  { email: "agent1@demo.test", role: "agent", label: "Sales Agent" },
  { email: "pm@demo.test", role: "property_manager", label: "Property Manager" },
  { email: "marketing@demo.test", role: "marketing", label: "Marketing" },
  { email: "finance@demo.test", role: "finance", label: "Finance" },
  { email: "portal@demo.test", role: "portal", label: "Portal User" },
];
