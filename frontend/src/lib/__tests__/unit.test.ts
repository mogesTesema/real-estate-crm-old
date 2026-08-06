import { describe, expect, it } from "vitest";

import { listingStatusTone, toneClass, humanize } from "../status";
import { canAccess, navForRole, isAdminRole } from "../roles";
import { money, compactMoney } from "../format";
import { parseCsv, toCsv } from "../csv";

describe("status", () => {
  it("maps listing statuses to tones", () => {
    expect(listingStatusTone.active).toBe("success");
    expect(listingStatusTone.draft).toBe("muted");
  });

  it("returns tone classes", () => {
    expect(toneClass("success")).toContain("success");
  });

  it("humanizes keys", () => {
    expect(humanize("under_offer")).toMatch(/under/i);
  });
});

describe("roles", () => {
  it("filters nav for agent", () => {
    const nav = navForRole("agent");
    expect(nav.some((n) => n.to === "/leads")).toBe(true);
    expect(nav.some((n) => n.to === "/leads/routing")).toBe(false);
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
