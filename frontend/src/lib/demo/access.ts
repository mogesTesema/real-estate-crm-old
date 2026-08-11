/**
 * Per-resource isolation rules for the frontend demo layer.
 *
 * Mirrors the backend's all/branch/own visibility concept (apps/core/permissions.py),
 * but keyed by resource domain rather than role alone: Finance is tenant-wide on
 * commissions/invoices/transactions yet has zero access to leases, and Marketing is
 * tenant-wide on campaigns yet has zero access to any finance resource. `roles` is the
 * base gate (who can see this resource at all); `ownerScoped` + `allScopeRoles` decide,
 * for the roles that pass the gate, whether they see every row or only rows tagged with
 * their own identity via a shared `ownerEmail` field on the fixture row.
 */
import { DEMO_LOGINS, type RoleKey } from "../roles";
import type { DemoResource } from "./fixtures";

export interface ResourceAccessRule {
  /** Roles allowed to read this resource at all. Anyone else gets zero rows. */
  roles: RoleKey[];
  /** When true, roles not listed in allScopeRoles are filtered to row.ownerEmail === me.email. */
  ownerScoped?: boolean;
  /** Subset of `roles` exempt from ownerEmail filtering (they see every row). */
  allScopeRoles?: RoleKey[];
}

function loginEmail(role: RoleKey): string {
  const login = DEMO_LOGINS.find((d) => d.role === role);
  if (!login) throw new Error(`No DEMO_LOGINS entry for role ${role}`);
  return login.email;
}

/** Single source of truth for demo identity emails, used by fixtures + isolation tests. */
export const DEMO_IDENTITIES = {
  superAdmin: loginEmail("super_admin"),
  owner: loginEmail("owner"),
  manager: loginEmail("manager"),
  agent1: loginEmail("agent"),
  propertyManager: loginEmail("property_manager"),
  marketing: loginEmail("marketing"),
  finance: loginEmail("finance"),
  portal: loginEmail("portal"),
} as const;

/** Extra seeded agents beyond agent1 (backend seed_demo.py creates agent1..agent5). */
export const AGENT_EMAILS = [
  "agent1@demo.test",
  "agent2@demo.test",
  "agent3@demo.test",
  "agent4@demo.test",
  "agent5@demo.test",
] as const;

export const RESOURCE_ACCESS: Partial<Record<DemoResource, ResourceAccessRule>> = {
  commissions: {
    roles: ["agent", "manager", "owner", "finance", "super_admin"],
    ownerScoped: true,
    allScopeRoles: ["manager", "owner", "finance", "super_admin"],
  },
  messages: {
    roles: ["agent", "manager", "owner", "super_admin"],
    ownerScoped: true,
    allScopeRoles: ["manager", "owner", "super_admin"],
  },
  calendar: {
    roles: ["agent", "manager", "owner", "super_admin", "portal"],
    ownerScoped: true,
    allScopeRoles: ["manager", "owner", "super_admin"],
  },
  leases: {
    roles: ["property_manager", "owner", "manager", "super_admin", "portal"],
    ownerScoped: true,
    allScopeRoles: ["property_manager", "owner", "manager", "super_admin"],
  },
  tenants: {
    roles: ["property_manager", "owner", "manager", "super_admin"],
  },
  rentInvoices: {
    roles: ["property_manager", "owner", "finance", "super_admin", "portal"],
    ownerScoped: true,
    allScopeRoles: ["property_manager", "owner", "finance", "super_admin"],
  },
  payments: {
    roles: ["property_manager", "owner", "finance", "super_admin", "portal"],
    ownerScoped: true,
    allScopeRoles: ["property_manager", "owner", "finance", "super_admin"],
  },
  workOrders: {
    roles: ["property_manager", "owner", "manager", "super_admin", "portal"],
    ownerScoped: true,
    allScopeRoles: ["property_manager", "owner", "manager", "super_admin"],
  },
  vendors: {
    roles: ["property_manager", "owner", "manager", "super_admin"],
  },
  invoices: {
    roles: ["finance", "owner", "super_admin"],
  },
  transactions: {
    roles: ["finance", "owner", "super_admin"],
  },
  campaigns: {
    roles: ["marketing", "owner", "super_admin"],
  },
  emailTemplates: {
    roles: ["marketing", "owner", "super_admin"],
  },
  landingPages: {
    roles: ["marketing", "owner", "super_admin"],
  },
  documents: {
    roles: ["agent", "manager", "owner", "super_admin", "property_manager", "portal"],
    ownerScoped: true,
    allScopeRoles: ["agent", "manager", "owner", "super_admin", "property_manager"],
  },
  portalDeals: {
    roles: ["portal"],
    ownerScoped: true,
    allScopeRoles: [],
  },
  favorites: {
    roles: ["portal"],
    ownerScoped: true,
    allScopeRoles: [],
  },
  savedSearches: {
    roles: ["portal"],
    ownerScoped: true,
    allScopeRoles: [],
  },
  ownerStatements: {
    roles: ["portal", "property_manager", "owner", "manager", "super_admin"],
    ownerScoped: true,
    allScopeRoles: ["property_manager", "owner", "manager", "super_admin"],
  },
  agents: {
    roles: ["owner", "manager", "super_admin"],
  },
  commissionPlans: {
    roles: ["owner", "manager", "super_admin"],
  },
  auditEvents: { roles: ["super_admin"] },
  tenantsAccounts: { roles: ["super_admin"] },
  subscriptions: { roles: ["super_admin"] },
  apiKeys: { roles: ["super_admin"] },
  webhooks: { roles: ["super_admin"] },
};

/** Pure filter used by useScopedDemoList and unit tests. */
export function scopeDemoRows<T extends Record<string, unknown>>(
  resource: DemoResource,
  rows: T[],
  role: RoleKey,
  email: string | undefined,
): T[] {
  const rule = RESOURCE_ACCESS[resource];
  if (!rule) return rows;
  if (!rule.roles.includes(role)) return [];
  if (!rule.ownerScoped) return rows;
  if (rule.allScopeRoles?.includes(role)) return rows;
  return rows.filter((r) => String(r.ownerEmail ?? "") === (email ?? ""));
}
