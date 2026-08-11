import { create } from "zustand";

import { FIXTURES, type DemoResource } from "./fixtures";

type Rows = Record<DemoResource, unknown[]>;

function cloneFixtures(): Rows {
  const out = {} as Rows;
  for (const key of Object.keys(FIXTURES) as DemoResource[]) {
    out[key] = structuredClone(FIXTURES[key]) as unknown[];
  }
  return out;
}

interface DemoState {
  data: Rows;
  list: (resource: DemoResource) => unknown[];
  get: (resource: DemoResource, id: string) => unknown | undefined;
  upsert: (resource: DemoResource, row: { id: string } & Record<string, unknown>) => void;
  remove: (resource: DemoResource, id: string) => void;
  patch: (
    resource: DemoResource,
    id: string,
    patch: Record<string, unknown>,
  ) => void;
  reset: () => void;
}

export const useDemoStore = create<DemoState>((set, get) => ({
  data: cloneFixtures(),
  list(resource) {
    return get().data[resource] ?? [];
  },
  get(resource, id) {
    return (get().data[resource] as { id: string }[] | undefined)?.find((r) => r.id === id);
  },
  upsert(resource, row) {
    set((state) => {
      const rows = [...(state.data[resource] as { id: string }[])];
      const idx = rows.findIndex((r) => r.id === row.id);
      if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
      else rows.unshift(row);
      return { data: { ...state.data, [resource]: rows } };
    });
  },
  remove(resource, id) {
    set((state) => ({
      data: {
        ...state.data,
        [resource]: (state.data[resource] as { id: string }[]).filter((r) => r.id !== id),
      },
    }));
  },
  patch(resource, id, patch) {
    set((state) => ({
      data: {
        ...state.data,
        [resource]: (state.data[resource] as { id: string }[]).map((r) =>
          r.id === id ? { ...r, ...patch } : r,
        ),
      },
    }));
  },
  reset() {
    set({ data: cloneFixtures() });
  },
}));
