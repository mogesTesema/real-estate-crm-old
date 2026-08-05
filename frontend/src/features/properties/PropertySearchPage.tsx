import { Bath, BedDouble, MapPin, Ruler, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "../../components/EmptyState";
import { MapSearch, type MapSearchValue } from "../../components/MapSearch";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SelectField } from "../../components/form/SelectField";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { LISTING_STATUSES, LISTING_TYPES, PROPERTY_CATEGORIES } from "../../lib/constants";
import { money } from "../../lib/format";
import { useList } from "../../lib/hooks";
import { listingStatusTone } from "../../lib/status";
import { FALLBACK_IMG, type Listing, type Property } from "./PropertiesPage";

interface LeadRow {
  id: string;
  name: string;
  preferred_location: string;
  budget_min: string | null;
  budget_max: string | null;
}

/**
 * Advanced property search (PROP-06 / SRS §3.3.7) with MapSearch radius filter.
 */
export function PropertySearchPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [beds, setBeds] = useState("");
  const [listingType, setListingType] = useState("");
  const [status, setStatus] = useState("active");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [mapFilter, setMapFilter] = useState<MapSearchValue | null>(null);
  const [matchLeadId, setMatchLeadId] = useState("");

  const leads = useList<LeadRow>("leads", { page_size: 100, status: "qualified" });

  const props = useList<Property>("properties", {
    search: q || undefined,
    category: category || undefined,
    city: city || undefined,
    bedrooms: beds || undefined,
    node_type: "property",
    page_size: 200,
    lat: mapFilter?.lat,
    lng: mapFilter?.lng,
    radius_km: mapFilter?.radiusKm,
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

  const results = useMemo(() => {
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    return (props.data?.results ?? []).filter((p) => {
      const listing = byProperty.get(p.id);
      if (status || listingType) {
        if (!listing) return false;
      }
      if (listing && min != null && Number(listing.price) < min) return false;
      if (listing && max != null && Number(listing.price) > max) return false;
      return true;
    });
  }, [props.data, byProperty, status, listingType, priceMin, priceMax]);

  function clear() {
    setQ("");
    setCity("");
    setCategory("");
    setBeds("");
    setListingType("");
    setStatus("");
    setPriceMin("");
    setPriceMax("");
    setMapFilter(null);
    setMatchLeadId("");
  }

  function matchToLead(leadId: string) {
    setMatchLeadId(leadId);
    const lead = (leads.data?.results ?? []).find((l) => l.id === leadId);
    if (!lead) return;
    if (lead.preferred_location) setCity(lead.preferred_location);
    if (lead.budget_min) setPriceMin(String(lead.budget_min));
    if (lead.budget_max) setPriceMax(String(lead.budget_max));
    toast.success(`Matched filters to ${lead.name || "lead"}`);
  }

  return (
    <div>
      <PageHeader
        title="Property search"
        description="Filter inventory by location, specs, price, map radius, and listing status."
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-semibold">Filters</p>
          <Input placeholder="Keyword…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input
            placeholder="City / area"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <SelectField
            value={category}
            onChange={setCategory}
            placeholder="Category"
            options={PROPERTY_CATEGORIES}
          />
          <SelectField
            value={listingType}
            onChange={setListingType}
            placeholder="Sale / Rent"
            options={LISTING_TYPES}
          />
          <SelectField
            value={status}
            onChange={setStatus}
            placeholder="Listing status"
            options={LISTING_STATUSES}
          />
          <Input
            type="number"
            placeholder="Min beds"
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min price"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max price"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
            />
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Users className="size-3.5" /> Match to lead
            </p>
            <SelectField
              value={matchLeadId}
              onChange={matchToLead}
              placeholder="Qualified lead…"
              options={(leads.data?.results ?? []).map((l) => ({
                value: l.id,
                label: l.name || l.id.slice(0, 8),
              }))}
            />
          </div>
          <Button variant="outline" className="w-full" onClick={clear}>
            Clear filters
          </Button>
        </aside>

        <div className="space-y-4">
          <MapSearch
            value={mapFilter}
            onChange={setMapFilter}
            height="240px"
          />

          <p className="text-sm text-muted-foreground">
            {props.isLoading ? "Searching…" : `${results.length} matching properties`}
            {mapFilter ? ` within ${mapFilter.radiusKm} km` : ""}
          </p>

          {props.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matches"
              description="Widen your filters or clear price/status constraints."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((p) => {
                const listing = byProperty.get(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigate(`/properties/${p.id}`)}
                    className="flex gap-3 overflow-hidden rounded-lg border border-border bg-card p-3 text-left shadow-card transition-shadow hover:shadow-lg"
                  >
                    <img
                      src={p.custom_fields?.image_url || FALLBACK_IMG}
                      alt=""
                      className="size-20 shrink-0 rounded-md object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-semibold">{p.title}</h3>
                        {listing && (
                          <StatusBadge
                            value={listing.status}
                            tone={listingStatusTone[listing.status] ?? "muted"}
                          />
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {p.city || "—"}
                      </p>
                      {listing && (
                        <p className="mt-1 font-semibold tabular text-primary">
                          {money(listing.price, listing.currency)}
                        </p>
                      )}
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                        {p.bedrooms != null && (
                          <span className="flex items-center gap-0.5">
                            <BedDouble className="size-3.5" /> {p.bedrooms}
                          </span>
                        )}
                        {p.bathrooms != null && (
                          <span className="flex items-center gap-0.5">
                            <Bath className="size-3.5" /> {p.bathrooms}
                          </span>
                        )}
                        {p.area_built && (
                          <span className="flex items-center gap-0.5">
                            <Ruler className="size-3.5" /> {p.area_built}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
