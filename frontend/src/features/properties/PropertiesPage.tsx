import { type ColumnDef } from "@tanstack/react-table";
import {
  Bath,
  BedDouble,
  Building2,
  LayoutGrid,
  MapPin,
  Plus,
  Ruler,
  Table2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SelectField } from "../../components/form/SelectField";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { cn } from "../../lib/cn";
import { LISTING_STATUSES, LISTING_TYPES, PROPERTY_CATEGORIES } from "../../lib/constants";
import { money } from "../../lib/format";
import { listingStatusTone } from "../../lib/status";
import { useAuth } from "../../lib/auth";
import { useList } from "../../lib/hooks";
import { PropertySheet } from "./PropertySheet";

export interface Property {
  id: string;
  node_type: string;
  parent: string | null;
  title: string;
  category: string;
  description: string;
  address_line: string;
  city: string;
  region: string;
  latitude?: string | null;
  longitude?: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_built: string | null;
  amenities?: string[];
  owner: string | null;
  custom_fields: { image_url?: string };
  created_at: string;
}
export interface Listing {
  id: string;
  property: string;
  listing_type: string;
  price: string;
  currency: string;
  status: string;
  listing_agent?: string | null;
  co_listing_agent?: string | null;
  mandate?: string;
}

export const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=60";

export function PropertiesPage() {
  const { me } = useAuth();
  const isAgent = me?.role === "agent";
  const isPm = me?.role === "property_manager";
  const meId = me?.id ?? "";
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [listingType, setListingType] = useState(isPm ? "rent" : "");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (params.get("new")) {
      setCreating(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const props = useList<Property>("properties", {
    search: search || undefined,
    category: category || undefined,
    node_type: "property",
    page_size: 200,
  });
  const listings = useList<Listing>("listings", {
    listing_type: listingType || undefined,
    status: status || undefined,
    page_size: 200,
  });

  const byProperty = useMemo(() => {
    const map = new Map<string, Listing>();
    for (const l of listings.data?.results ?? []) {
      if (!map.has(l.property)) map.set(l.property, l);
    }
    return map;
  }, [listings.data]);

  const rows = useMemo(() => {
    let all = props.data?.results ?? [];
    if (listingType || status) {
      all = all.filter((p) => byProperty.has(p.id));
    }
    if (isAgent && meId) {
      all = all.filter((p) => {
        const l = byProperty.get(p.id);
        return Boolean(l && (l.listing_agent === meId || l.co_listing_agent === meId));
      });
    }
    if (isPm) {
      all = all.filter((p) => {
        const l = byProperty.get(p.id);
        return Boolean(l && l.listing_type === "rent");
      });
    }
    return all;
  }, [props.data, listingType, status, byProperty, isAgent, isPm, meId]);

  const columns = useMemo<ColumnDef<Property, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Property",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <img
              src={row.original.custom_fields?.image_url || FALLBACK_IMG}
              alt=""
              className="size-10 rounded-md object-cover"
              loading="lazy"
            />
            <div>
              <p className="font-medium">{row.original.title}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {row.original.city || "—"}
              </p>
            </div>
          </div>
        ),
      },
      { accessorKey: "category", header: "Category" },
      {
        accessorKey: "bedrooms",
        header: "Beds",
        cell: ({ getValue }) => String(getValue() ?? "—"),
      },
      {
        id: "price",
        header: "Price",
        cell: ({ row }) => {
          const l = byProperty.get(row.original.id);
          return l ? (
            <span className="font-semibold tabular">{money(l.price, l.currency)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "status",
        header: "Listing",
        cell: ({ row }) => {
          const l = byProperty.get(row.original.id);
          return l ? (
            <StatusBadge value={l.status} tone={listingStatusTone[l.status] ?? "muted"} />
          ) : (
            <StatusBadge value="not listed" tone="muted" />
          );
        },
      },
    ],
    [byProperty],
  );

  const viewState = { search, category, listingType, status, view };

  return (
    <div>
      <PageHeader
        title={isPm ? "Managed Properties" : "Properties"}
        description={
          isPm
            ? "Rental units in the portfolio. Property Manager assignment (managed_by) is not on the API yet."
            : "Your listing inventory — for sale and for rent."
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-input">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "flex h-9 items-center px-3 text-sm",
                  view === "grid" ? "bg-muted font-medium" : "text-muted-foreground",
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setView("table")}
                className={cn(
                  "flex h-9 items-center border-l border-input px-3 text-sm",
                  view === "table" ? "bg-muted font-medium" : "text-muted-foreground",
                )}
                aria-label="Table view"
              >
                <Table2 className="size-4" />
              </button>
            </div>
            {!isPm && (
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" /> Add property
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search properties…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <SelectField
          value={category}
          onChange={setCategory}
          placeholder="Category"
          options={PROPERTY_CATEGORIES}
          className="w-36"
        />
        {!isPm && (
          <SelectField
            value={listingType}
            onChange={setListingType}
            placeholder="Sale / Rent"
            options={LISTING_TYPES}
            className="w-32"
          />
        )}
        <SelectField
          value={status}
          onChange={setStatus}
          placeholder="Listing status"
          options={LISTING_STATUSES}
          className="w-36"
        />
        {(category || status || (isPm ? listingType !== "rent" : listingType)) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategory("");
              setListingType(isPm ? "rent" : "");
              setStatus("");
            }}
          >
            Clear
          </Button>
        )}
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
            entity="property"
          title="No properties found"
          description="Adjust filters or add a new listing to start marketing it."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" /> Add property
            </Button>
          }
        />
      ) : view === "table" ? (
        <DataTable
          data={rows}
          columns={columns}
          columnToggle
          viewKey="properties"
          viewState={viewState}
          onApplyView={(s) => {
            setSearch(String(s.search ?? ""));
            setCategory(String(s.category ?? ""));
            setListingType(String(s.listingType ?? ""));
            setStatus(String(s.status ?? ""));
            setView((s.view as "grid" | "table") ?? "table");
          }}
          onRowClick={(p) => navigate(`/properties/${p.id}`)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => {
            const listing = byProperty.get(p.id);
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/properties/${p.id}`)}
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
    </div>
  );
}
