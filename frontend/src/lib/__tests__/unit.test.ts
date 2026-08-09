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
  ALL_ROLES,
} from "../roles";
import { money, compactMoney } from "../format";
import { parseCsv, toCsv } from "../csv";

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
});

describe("roles", () => {
  it("filters flat nav for agent (live items only)", () => {
    const nav = navForRole("agent");
    expect(nav.some((n) => n.to.split("?")[0] === "/leads")).toBe(true);
    expect(nav.some((n) => n.to.includes("/leads/routing"))).toBe(false);
    expect(nav.every((n) => !!n.to)).toBe(true);
  });

  it("exposes grouped ROLE_NAV for every role", () => {
    for (const role of ALL_ROLES) {
      const groups = groupsForRole(role);
      expect(groups.length).toBeGreaterThan(0);
      expect(ROLE_NAV[role]).toBeDefined();
      // Every role has at least one locked Phase-N stub OR live dashboard.
      const flat = groups.flatMap((g) => g.items);
      expect(flat.some((i) => i.to === "/" || i.lockedPhase)).toBe(true);
    }
  });

  it("marks locked items as non-routable", () => {
    const locked = groupsForRole("agent")
      .flatMap((g) => g.items)
      .filter((i) => i.lockedPhase);
    expect(locked.length).toBeGreaterThan(0);
    expect(locked.every((i) => !i.to)).toBe(true);
  });

  it("guards admin routes", () => {
    expect(canAccess("agent", "/leads/routing")).toBe(false);
    expect(canAccess("owner", "/leads/routing")).toBe(true);
    expect(isAdminRole("manager")).toBe(true);
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
