import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { Dialog, DialogContent } from "./ui/dialog";

interface Hit {
  kind: "lead" | "contact" | "property" | "deal";
  id: string;
  title: string;
  subtitle: string;
}

/**
 * Global search (SHELL / SRS §4.1). Queries list endpoints in parallel and
 * deep-links into the matching module.
 */
export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQ("");
      setHits([]);
    }
  }, [open]);

  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { search: q.trim(), page_size: 5 };
        const [leads, contacts, properties, opps] = await Promise.all([
          api.get("/leads/", { params }),
          api.get("/contacts/", { params }),
          api.get("/properties/", { params }),
          api.get("/opportunities/", { params }),
        ]);
        if (cancelled) return;
        const next: Hit[] = [
          ...((leads.data.results ?? []) as { id: string; name: string; email: string }[]).map(
            (r) => ({
              kind: "lead" as const,
              id: r.id,
              title: r.name || r.email || "Lead",
              subtitle: r.email,
            }),
          ),
          ...((contacts.data.results ?? []) as {
            id: string;
            full_name: string;
            email: string;
          }[]).map((r) => ({
            kind: "contact" as const,
            id: r.id,
            title: r.full_name || "Contact",
            subtitle: r.email,
          })),
          ...((properties.data.results ?? []) as {
            id: string;
            title: string;
            city: string;
          }[]).map((r) => ({
            kind: "property" as const,
            id: r.id,
            title: r.title,
            subtitle: r.city,
          })),
          ...((opps.data.results ?? []) as { id: string; title: string; status: string }[]).map(
            (r) => ({
              kind: "deal" as const,
              id: r.id,
              title: r.title,
              subtitle: r.status,
            }),
          ),
        ];
        setHits(next);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  function go(hit: Hit) {
    const routes: Record<Hit["kind"], string> = {
      lead: "/leads",
      contact: "/contacts",
      property: `/properties/${hit.id}`,
      deal: "/pipeline",
    };
    navigate(routes[hit.kind]);
    onOpenChange(false);
  }

  const kindLabel = { lead: "Lead", contact: "Contact", property: "Property", deal: "Deal" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[18%] max-w-lg translate-y-0 p-0">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search leads, contacts, properties, deals…"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Searching…</p>
          )}
          {!loading && q.trim().length >= 2 && hits.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No results.</p>
          )}
          {!loading &&
            hits.map((h) => (
              <button
                key={`${h.kind}-${h.id}`}
                onClick={() => go(h)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="w-16 shrink-0 text-xs font-medium uppercase text-muted-foreground">
                  {kindLabel[h.kind]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{h.title}</span>
                  {h.subtitle && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {h.subtitle}
                    </span>
                  )}
                </span>
              </button>
            ))}
          {q.trim().length < 2 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
