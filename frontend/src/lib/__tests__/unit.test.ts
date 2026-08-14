import { describe, expect, it } from "vitest";

import {
  listingStatusTone,
  leadStatusTone,
  toneClass,
  toneForStatus,
  humanize,
} from "../status";
import {
  canAccess,
  navForRole,
  groupsForRole,
  isAdminRole,
  ROLE_NAV,
  ROUTE_ROLES,
  ALL_ROLES,
  type RoleKey,
} from "../roles";
import { money, compactMoney } from "../format";
import { parseCsv, toCsv } from "../csv";
import {
  DEMO_IDENTITIES,
  RESOURCE_ACCESS,
  scopeDemoRows,
} from "../demo/access";
import { FIXTURES } from "../demo/fixtures";

describe("status", () => {
  it("maps listing statuses to tones", () => {
    expect(listingStatusTone.active).toBe("success");
    expect(listingStatusTone.draft).toBe("muted");
    expect(listingStatusTone.under_offer).toBe("under_offer");
    expect(listingStatusTone.reserved).toBe("reserved");
    expect(listingStatusTone.sold).toBe("reserved");
  });

  it("maps lead contacted/qualified per doc matrix", () => {
    expect(leadStatusTone.contacted).toBe("primary");
    expect(leadStatusTone.qualified).toBe("warning");
    expect(toneForStatus("contacted", "lead")).toBe("primary");
    expect(toneForStatus("unknown", "lead")).toBe("muted");
  });

  it("returns tone classes for new tones", () => {
    expect(toneClass("success")).toContain("success");
    expect(toneClass("under_offer")).toContain("under-offer");
    expect(toneClass("reserved")).toContain("reserved");
  });

  it("humanizes keys", () => {
    expect(humanize("under_offer")).toMatch(/under/i);
  });

  it("maps platform statuses for admin surfaces", () => {
    expect(toneForStatus("failing", "system")).toBe("destructive");
    expect(toneForStatus("success", "system")).toBe("success");
    expect(toneForStatus("GPS_TRACK_VIEW", "audit")).toBe("primary");
  });
});

describe("roles", () => {
  it("filters flat nav for agent (live items only)", () => {
    const nav = navForRole("agent");
    expect(nav.some((n) => n.to.split("?")[0] === "/leads")).toBe(true);
    expect(nav.some((n) => n.to.includes("/leads/routing"))).toBe(false);
    expect(nav.every((n) => !!n.to)).toBe(true);
  });

  it("exposes grouped ROLE_NAV for every role with a dashboard", () => {
    for (const role of ALL_ROLES) {
      const groups = groupsForRole(role);
      expect(groups.length).toBeGreaterThan(0);
      expect(ROLE_NAV[role]).toBeDefined();
      const flat = groups.flatMap((g) => g.items);
      expect(flat.some((i) => i.to === "/")).toBe(true);
      expect(flat.every((i) => !!i.to)).toBe(true);
    }
  });

  it("gives each role distinct navigable modules", () => {
    const agentPaths = navForRole("agent").map((n) => n.to.split("?")[0]);
    const pmPaths = navForRole("property_manager").map((n) => n.to.split("?")[0]);
    const financePaths = navForRole("finance").map((n) => n.to.split("?")[0]);
    expect(agentPaths).toContain("/calendar");
    expect(pmPaths).toContain("/leases");
    expect(financePaths).toContain("/finance/commissions");
    expect(agentPaths).not.toContain("/admin/users");
  });

  it("keeps Super Admin nav on governance routes only", () => {
    const groups = groupsForRole("super_admin");
    expect(groups.map((g) => g.label)).toEqual([
      "Dashboard",
      "Administration",
      "Reports",
      "Integrations",
      "Help & Support",
    ]);
    expect(groups.every((g) => g.items.length > 1 && g.icon)).toBe(true);
    const adminPaths = navForRole("super_admin").map((n) => n.to.split("?")[0]);
    expect(adminPaths).toContain("/admin/company");
    expect(adminPaths).toContain("/admin/org");
    expect(adminPaths).toContain("/admin/settings");
    expect(adminPaths).not.toContain("/leads");
    expect(adminPaths).not.toContain("/pipeline");
    expect(adminPaths).not.toContain("/admin/tenants");
    expect(adminPaths).not.toContain("/admin/subscriptions/plans");
  });

  it("guards admin and role-scoped routes", () => {
    expect(canAccess("agent", "/leads/routing")).toBe(false);
    expect(canAccess("owner", "/leads/routing")).toBe(true);
    expect(canAccess("portal", "/finance/commissions")).toBe(false);
    expect(canAccess("finance", "/finance/commissions")).toBe(true);
    expect(canAccess("super_admin", "/admin/company")).toBe(true);
    expect(canAccess("super_admin", "/admin/org")).toBe(true);
    expect(canAccess("super_admin", "/admin/settings")).toBe(true);
    expect(canAccess("agent", "/admin/users")).toBe(false);
    expect(isAdminRole("manager")).toBe(true);
  });

  it("keeps Manager nav on branch oversight only", () => {
    const managerPaths = navForRole("manager").map((n) => n.to.split("?")[0]);
    expect(managerPaths).toContain("/team/owners");
    expect(managerPaths).toContain("/team/gps");
    expect(managerPaths).toContain("/team/conflicts");
    expect(managerPaths).toContain("/leads/routing");
    expect(managerPaths).not.toContain("/finance/invoices");
    expect(managerPaths).not.toContain("/admin/users");
    expect(managerPaths).not.toContain("/team/commission-plans");
    expect(canAccess("manager", "/team/owners")).toBe(true);
    expect(canAccess("agent", "/team/owners")).toBe(false);
    expect(canAccess("owner", "/team/owners")).toBe(false);
  });

  it("keeps Owner nav on agency sales, finance, and GPS view", () => {
    const groups = groupsForRole("owner");
    expect(groups.map((g) => g.label)).toEqual([
      "Dashboard",
      "Leads",
      "Properties",
      "Deals & Pipeline",
      "Team",
      "Finance",
      "Reports",
      "Clients",
      "Marketing Oversight",
      "Settings",
    ]);
    expect(groups.every((g) => g.items.length > 1 && g.icon)).toBe(true);
    const ownerPaths = navForRole("owner").map((n) => n.to.split("?")[0]);
    expect(ownerPaths).toContain("/team/agents");
    expect(ownerPaths).toContain("/team/commission-plans");
    expect(ownerPaths).toContain("/team/gps");
    expect(ownerPaths).toContain("/finance/invoices");
    expect(ownerPaths).toContain("/clients/vip");
    expect(ownerPaths).toContain("/marketing/campaigns");
    expect(ownerPaths).not.toContain("/team/owners");
    expect(ownerPaths).not.toContain("/admin/users");
    expect(ownerPaths).not.toContain("/finance/vat");
    expect(ownerPaths).not.toContain("/properties/search");
    expect(canAccess("owner", "/team/owners")).toBe(false);
    expect(canAccess("owner", "/team/gps")).toBe(true);
    expect(canAccess("owner", "/clients/vip")).toBe(true);
    expect(canAccess("manager", "/clients/vip")).toBe(false);
    expect(canAccess("agent", "/team/gps")).toBe(false);
  });

  it("keeps Agent nav personal-only with GPS capture", () => {
    const groups = groupsForRole("agent");
    expect(groups.every((g) => g.items.length > 1 && g.icon)).toBe(true);
    const agentPaths = navForRole("agent").map((n) => n.to.split("?")[0]);
    expect(agentPaths).toContain("/leads");
    expect(agentPaths).toContain("/field/gps");
    expect(agentPaths).toContain("/portal/invite");
    expect(agentPaths).toContain("/goals");
    expect(agentPaths).toContain("/tasks");
    expect(agentPaths).toContain("/reports/my-commission");
    expect(agentPaths).not.toContain("/leads/routing");
    expect(agentPaths).not.toContain("/team/owners");
    expect(agentPaths).not.toContain("/team/gps");
    expect(agentPaths).not.toContain("/finance/invoices");
    expect(agentPaths).not.toContain("/admin/users");
    expect(canAccess("agent", "/field/gps")).toBe(true);
    expect(canAccess("agent", "/team/gps")).toBe(false);
    expect(canAccess("agent", "/leads/routing")).toBe(false);
    expect(canAccess("owner", "/field/gps")).toBe(false);
    expect(canAccess("manager", "/portal/invite")).toBe(false);
  });

  it("keeps Property Manager nav on portfolio work only", () => {
    const groups = groupsForRole("property_manager");
    expect(groups.every((g) => g.items.length > 1 && g.icon)).toBe(true);
    expect(groups.map((g) => g.label)).toEqual([
      "Dashboard",
      "Properties",
      "Leases",
      "Tenants",
      "Rent Collection",
      "Maintenance",
      "Inspections & utilities",
      "Reports",
      "Settings",
    ]);
    const pmPaths = navForRole("property_manager").map((n) => n.to.split("?")[0]);
    expect(pmPaths).toContain("/leases");
    expect(pmPaths).toContain("/tenants");
    expect(pmPaths).toContain("/rent/invoices");
    expect(pmPaths).toContain("/maintenance");
    expect(pmPaths).toContain("/reports/occupancy");
    expect(pmPaths).toContain("/reports/financial");
    expect(pmPaths).toContain("/inspections");
    expect(pmPaths).toContain("/utilities");
    expect(pmPaths).not.toContain("/leads");
    expect(pmPaths).not.toContain("/pipeline");
    expect(pmPaths).not.toContain("/contacts");
    expect(pmPaths).not.toContain("/properties/search");
    expect(pmPaths).not.toContain("/finance/invoices");
    expect(pmPaths).not.toContain("/finance/vat");
    expect(pmPaths).not.toContain("/team/gps");
    expect(pmPaths).not.toContain("/admin/users");
    expect(canAccess("property_manager", "/finance/vat")).toBe(false);
    expect(canAccess("property_manager", "/reports/financial")).toBe(true);
    expect(canAccess("property_manager", "/inspections")).toBe(true);
    expect(canAccess("finance", "/leases")).toBe(false);
    expect(canAccess("owner", "/reports/financial")).toBe(false);
    expect(canAccess("agent", "/inspections")).toBe(false);
  });

  it("default-denies unknown paths", () => {
    expect(canAccess("owner", "/secret-backdoor")).toBe(false);
    expect(canAccess("super_admin", "/not-a-real-route")).toBe(false);
  });

  it("applies the isolation denial matrix", () => {
    expect(canAccess("portal", "/maintenance")).toBe(false);
    expect(canAccess("portal", "/finance/invoices")).toBe(false);
    expect(canAccess("portal", "/portal/lease/maintenance")).toBe(true);

    expect(canAccess("manager", "/finance/vat")).toBe(false);
    expect(canAccess("manager", "/finance/invoices")).toBe(false);
    expect(canAccess("manager", "/finance/commissions")).toBe(true);
    expect(canAccess("manager", "/finance/reports/commission")).toBe(true);
    expect(canAccess("manager", "/finance/reports")).toBe(false);

    expect(canAccess("agent", "/reports/leaderboard")).toBe(false);
    expect(canAccess("agent", "/reports/my-commission")).toBe(true);
    expect(canAccess("agent", "/reports")).toBe(false);

    expect(canAccess("marketing", "/finance/commissions")).toBe(false);
    expect(canAccess("marketing", "/leases")).toBe(false);
    expect(canAccess("marketing", "/tenants")).toBe(false);
    expect(canAccess("marketing", "/marketing/campaigns")).toBe(true);

    expect(canAccess("finance", "/leases")).toBe(false);
    expect(canAccess("property_manager", "/finance/vat")).toBe(false);
  });

  it("has an explicit ROUTE_ROLES entry for every App path prefix used in nav", () => {
    const navPaths = new Set<string>();
    for (const role of ALL_ROLES) {
      for (const item of navForRole(role)) {
        navPaths.add(item.to.split("?")[0]);
      }
    }
    for (const path of navPaths) {
      expect(canAccess("super_admin", path) || canAccess("owner", path) || canAccess("agent", path) || canAccess("portal", path) || canAccess("finance", path) || canAccess("marketing", path) || canAccess("property_manager", path) || canAccess("manager", path)).toBe(true);
      const entry = Object.keys(ROUTE_ROLES)
        .sort((a, b) => b.length - a.length)
        .find((prefix) => path === prefix || path.startsWith(prefix + "/"));
      expect(entry, `missing ROUTE_ROLES for ${path}`).toBeTruthy();
    }
  });
});

describe("demo scope isolation", () => {
  it("scopes agent commissions to their own rows only", () => {
    const agent1 = scopeDemoRows(
      "commissions",
      FIXTURES.commissions as unknown as Record<string, unknown>[],
      "agent",
      DEMO_IDENTITIES.agent1,
    );
    expect(agent1.length).toBeGreaterThan(0);
    expect(agent1.every((r) => r.ownerEmail === DEMO_IDENTITIES.agent1)).toBe(true);

    const agent2 = scopeDemoRows(
      "commissions",
      FIXTURES.commissions as unknown as Record<string, unknown>[],
      "agent",
      "agent2@demo.test",
    );
    expect(agent2.every((r) => r.ownerEmail === "agent2@demo.test")).toBe(true);
    expect(agent1.some((r) => agent2.some((o) => o.id === r.id))).toBe(false);
  });

  it("gives finance all commissions and marketing none", () => {
    const finance = scopeDemoRows(
      "commissions",
      FIXTURES.commissions as unknown as Record<string, unknown>[],
      "finance",
      DEMO_IDENTITIES.finance,
    );
    expect(finance.length).toBe(FIXTURES.commissions.length);

    const marketing = scopeDemoRows(
      "commissions",
      FIXTURES.commissions as unknown as Record<string, unknown>[],
      "marketing",
      DEMO_IDENTITIES.marketing,
    );
    expect(marketing).toEqual([]);
  });

  it("keeps rentInvoices separate from finance invoices", () => {
    expect(FIXTURES.rentInvoices.every((r) => r.type === "Rent")).toBe(true);
    expect(FIXTURES.invoices.every((r) => r.type !== "Rent")).toBe(true);

    const pmRent = scopeDemoRows(
      "rentInvoices",
      FIXTURES.rentInvoices as unknown as Record<string, unknown>[],
      "property_manager",
      DEMO_IDENTITIES.propertyManager,
    );
    expect(pmRent.length).toBe(FIXTURES.rentInvoices.length);

    const pmFinanceInv = scopeDemoRows(
      "invoices",
      FIXTURES.invoices as unknown as Record<string, unknown>[],
      "property_manager",
      DEMO_IDENTITIES.propertyManager,
    );
    expect(pmFinanceInv).toEqual([]);
  });

  it("lets Owner view GPS sessions and VIP clients, not owner-registration rows", () => {
    const gps = scopeDemoRows(
      "fieldSessions",
      FIXTURES.fieldSessions as unknown as Record<string, unknown>[],
      "owner",
      DEMO_IDENTITIES.owner,
    );
    expect(gps.length).toBe(FIXTURES.fieldSessions.length);

    const vips = scopeDemoRows(
      "vipClients",
      FIXTURES.vipClients as unknown as Record<string, unknown>[],
      "owner",
      DEMO_IDENTITIES.owner,
    );
    expect(vips.length).toBe(FIXTURES.vipClients.length);

    const owners = scopeDemoRows(
      "brokerOwners",
      FIXTURES.brokerOwners as unknown as Record<string, unknown>[],
      "owner",
      DEMO_IDENTITIES.owner,
    );
    expect(owners).toEqual([]);
  });

  it("scopes Agent GPS sessions to their own rows only", () => {
    const mine = scopeDemoRows(
      "fieldSessions",
      FIXTURES.fieldSessions as unknown as Record<string, unknown>[],
      "agent",
      DEMO_IDENTITIES.agent1,
    );
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((r) => r.ownerEmail === DEMO_IDENTITIES.agent1)).toBe(true);
    expect(mine.length).toBeLessThan(FIXTURES.fieldSessions.length);

    const other = scopeDemoRows(
      "fieldSessions",
      FIXTURES.fieldSessions as unknown as Record<string, unknown>[],
      "agent",
      "agent2@demo.test",
    );
    expect(other.every((r) => r.ownerEmail === "agent2@demo.test")).toBe(true);
    expect(mine.some((r) => other.some((o) => o.id === r.id))).toBe(false);
  });

  it("scopes portal lists to portal@demo.test only", () => {
    for (const resource of ["portalDeals", "favorites", "savedSearches", "calendar"] as const) {
      const rows = scopeDemoRows(
        resource,
        FIXTURES[resource] as unknown as Record<string, unknown>[],
        "portal",
        DEMO_IDENTITIES.portal,
      );
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r.ownerEmail === DEMO_IDENTITIES.portal)).toBe(true);
    }
  });

  it("denies marketing zero-access finance and lease resources", () => {
    const denied = ["invoices", "transactions", "leases", "tenants", "commissions"] as const;
    for (const resource of denied) {
      const rule = RESOURCE_ACCESS[resource];
      expect(rule?.roles.includes("marketing" as RoleKey) ?? false).toBe(false);
      const rows = scopeDemoRows(
        resource,
        (FIXTURES[resource] as unknown as Record<string, unknown>[]) ?? [],
        "marketing",
        DEMO_IDENTITIES.marketing,
      );
      expect(rows).toEqual([]);
    }
  });
});

describe("format", () => {
  it("formats money", () => {
    expect(money(1500, "USD")).toContain("1,500");
    expect(compactMoney(1_500_000)).toMatch(/M|1\.5/);
  });
});

describe("csv", () => {
  it("round-trips simple rows", () => {
    const csv = toCsv([
      ["a", "b"],
      ["1", "hello, world"],
    ]);
    const rows = parseCsv(csv);
    expect(rows[0]).toEqual(["a", "b"]);
    expect(rows[1][1]).toBe("hello, world");
  });
});
