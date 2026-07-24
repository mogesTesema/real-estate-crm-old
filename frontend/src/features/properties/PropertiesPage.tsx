import { Bath, BedDouble, Building2, MapPin, Plus, Ruler } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { money } from "../../lib/format";
import { listingStatusTone } from "../../lib/status";
import { useList } from "../../lib/hooks";
import { PropertySheet } from "./PropertySheet";

export interface Property {
  id: string;
  title: string;
  category: string;
  city: string;
  region: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_built: string | null;
  custom_fields: { image_url?: string };
}
interface Listing {
  id: string;
  property: string;
  price: string;
  currency: string;
  status: string;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=60";

export function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const props = useList<Property>("properties", { search: search || undefined });
  const listings = useList<Listing>("listings", { page_size: 200 });

  const byProperty = useMemo(() => {
    const map = new Map<string, Listing>();
    for (const l of listings.data?.results ?? []) {
      if (!map.has(l.property)) map.set(l.property, l);
    }
    return map;
  }, [listings.data]);

  const rows = props.data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Your listing inventory — for sale and for rent."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Add property
          </Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search properties…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {props.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add your first listing to start marketing it."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" /> Add property
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => {
            const listing = byProperty.get(p.id);
            return (
              <button
                key={p.id}
                onClick={() => setEditing(p)}
                className="group overflow-hidden rounded-lg border border-border bg-card text-left shadow-card transition-shadow hover:shadow-lg"
              >
                <div className="relative h-40 overflow-hidden bg-muted">
                  <img
                    src={p.custom_fields?.image_url || FALLBACK_IMG}
                    alt={p.title}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  {listing && (
                    <div className="absolute left-3 top-3">
                      <StatusBadge
                        value={listing.status}
                        tone={listingStatusTone[listing.status] ?? "muted"}
                        className="shadow"
                      />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold">{p.title}</h3>
                    {listing && (
                      <span className="shrink-0 font-semibold tabular text-primary">
                        {money(listing.price, listing.currency)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" /> {p.city || "—"}
                  </p>
                  <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                    {p.bedrooms != null && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="size-4" /> {p.bedrooms}
                      </span>
                    )}
                    {p.bathrooms != null && (
                      <span className="flex items-center gap-1">
                        <Bath className="size-4" /> {p.bathrooms}
                      </span>
                    )}
                    {p.area_built && (
                      <span className="flex items-center gap-1">
                        <Ruler className="size-4" /> {p.area_built}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {creating && <PropertySheet open={creating} onOpenChange={setCreating} />}
      {editing && (
        <PropertySheet
          property={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </div>
  );
}
