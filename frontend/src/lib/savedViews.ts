/**
 * Saved table views (SRS §4.1) — persisted client-side per resource.
 * A view captures filter/search state (owned by the page) plus sorting and
 * column visibility (owned by DataTable).
 */
export interface SavedView {
  id: string;
  name: string;
  state: Record<string, unknown>;
}

const PREFIX = "saved-view:";

function read(key: string): SavedView[] {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key) ?? "[]") as SavedView[];
  } catch {
    return [];
  }
}

export function listViews(key: string): SavedView[] {
  return read(key);
}

export function saveView(key: string, name: string, state: Record<string, unknown>): SavedView {
  const views = read(key);
  const existing = views.find((v) => v.name === name);
  if (existing) {
    existing.state = state;
    localStorage.setItem(PREFIX + key, JSON.stringify(views));
    return existing;
  }
  const view: SavedView = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    state,
  };
  localStorage.setItem(PREFIX + key, JSON.stringify([...views, view]));
  return view;
}

export function deleteView(key: string, id: string) {
  localStorage.setItem(
    PREFIX + key,
    JSON.stringify(read(key).filter((v) => v.id !== id)),
  );
}
