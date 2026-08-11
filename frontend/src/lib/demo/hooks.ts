import { useMemo, useState } from "react";

import { useAuth } from "../auth";
import type { Paginated } from "../hooks";
import type { RoleKey } from "../roles";
import { RESOURCE_ACCESS } from "./access";
import type { DemoResource } from "./fixtures";
import { useDemoStore } from "./store";

function matchesFilter(row: Record<string, unknown>, params?: Record<string, unknown>) {
  if (!params) return true;
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "" || key === "page_size" || key === "q") continue;
    if (key === "status" && Array.isArray(value)) {
      if (!value.includes(row.status)) return false;
      continue;
    }
    if (String(row[key] ?? "").toLowerCase() !== String(value).toLowerCase()) return false;
  }
  return true;
}

function matchesSearch(row: Record<string, unknown>, q?: string) {
  if (!q?.trim()) return true;
  const needle = q.trim().toLowerCase();
  return Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(needle));
}

/** Mirrors useList but reads the in-memory demo store. */
export function useDemoList<T extends { id: string } = { id: string } & Record<string, unknown>>(
  resource: DemoResource,
  params?: Record<string, unknown>,
) {
  const rows = useDemoStore((s) => s.data[resource]) as unknown as T[];
  const [ready] = useState(true);

  const filtered = useMemo(() => {
    const q = typeof params?.q === "string" ? params.q : undefined;
    return rows.filter(
      (r) =>
        matchesFilter(r as Record<string, unknown>, params) &&
        matchesSearch(r as Record<string, unknown>, q),
    );
  }, [rows, params]);

  const pageSize = Number(params?.page_size ?? 200);
  const page = filtered.slice(0, pageSize);

  const data: Paginated<T> = { count: filtered.length, results: page };

  return {
    data,
    isLoading: !ready,
    isFetching: false,
    refetch: () => undefined,
  };
}

/**
 * Identity-aware wrapper around useDemoList. Applies the per-resource rule from
 * `./access` for the current user's role before delegating to useDemoList, so one
 * role's rows are never visible to another. Resources without a rule pass through
 * unchanged (not every demo resource needs isolation — e.g. shared directories).
 */
export function useScopedDemoList<T extends { id: string } = { id: string } & Record<string, unknown>>(
  resource: DemoResource,
  params?: Record<string, unknown>,
) {
  const role = useAuth((s) => (s.me?.role ?? "agent") as RoleKey);
  const email = useAuth((s) => s.me?.email);
  const rule = RESOURCE_ACCESS[resource];

  const scopedParams = useMemo(() => {
    if (!rule) return params;
    if (!rule.roles.includes(role)) return { ...params, id: "__no_access__" };
    if (!rule.ownerScoped) return params;
    if (rule.allScopeRoles?.includes(role)) return params;
    return { ...params, ownerEmail: email ?? "__no_access__" };
  }, [params, role, email, rule]);

  return useDemoList<T>(resource, scopedParams);
}

export function useDemoDetail<T extends { id: string } = { id: string } & Record<string, unknown>>(
  resource: DemoResource,
  id: string | undefined,
) {
  const row = useDemoStore((s) => (id ? s.get(resource, id) : undefined)) as
    | T
    | undefined;
  return {
    data: row,
    isLoading: false,
  };
}

export function useDemoMutate(resource: DemoResource) {
  const upsert = useDemoStore((s) => s.upsert);
  const remove = useDemoStore((s) => s.remove);
  const patch = useDemoStore((s) => s.patch);

  return {
    upsert: (row: { id: string } & Record<string, unknown>) => upsert(resource, row),
    remove: (id: string) => remove(resource, id),
    patch: (id: string, body: Record<string, unknown>) => patch(resource, id, body),
  };
}
