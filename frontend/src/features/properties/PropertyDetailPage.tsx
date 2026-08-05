import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  MapPin,
  Pencil,
  Ruler,
  Star,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { ActivityTimeline } from "../../components/ActivityTimeline";
import { PropertyMapPane } from "../../components/MapSearch";
import { StatusBadge } from "../../components/StatusBadge";
import { SelectField } from "../../components/form/SelectField";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { api, apiError } from "../../lib/api";
import { money, relativeTime } from "../../lib/format";
import { useDetail, useList, useUpdate } from "../../lib/hooks";
import { humanize, listingStatusTone } from "../../lib/status";
import { FALLBACK_IMG, type Listing, type Property } from "./PropertiesPage";
import { PropertySheet } from "./PropertySheet";
import { ListingStatusControl } from "./ListingStatusControl";

interface MediaItem {
  id: string;
  kind: string;
  file: string | null;
  url: string;
  caption: string;
}

interface ListingFull extends Listing {
  mandate: string;
  co_listing_agent?: string | null;
  listed_at: string | null;
  custom_fields?: { media_order?: string[]; cover_media_id?: string };
  media: MediaItem[];
  status_history: {
    id: string;
    from_status: string;
    to_status: string;
    reason: string;
    at: string;
  }[];
}

const MEDIA_KINDS = [
  { value: "photo", label: "Photo" },
  { value: "floorplan", label: "Floor plan" },
  { value: "brochure", label: "Brochure / PDF" },
  { value: "tour", label: "Virtual tour URL" },
];

const MANDATE_OPTIONS = [
  { value: "exclusive", label: "Exclusive" },
  { value: "open", label: "Open listing" },
];

/** Photo / floorplan / brochure upload + gallery with cover + reorder (SRS §3.3.3). */
function MediaManager({
  listing,
  propertyId,
  propertyFields,
}: {
  listing: ListingFull;
  propertyId: string;
  propertyFields: Record<string, unknown>;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState("photo");
  const [caption, setCaption] = useState("");
  const [tourUrl, setTourUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const updateListing = useUpdate("listings");
  const updateProperty = useUpdate("properties");

  const ordered = useMemo(() => {
    const order = listing.custom_fields?.media_order ?? [];
    const byId = new Map(listing.media.map((m) => [m.id, m]));
    const first = order.map((id) => byId.get(id)).filter(Boolean) as MediaItem[];
    const rest = listing.media.filter((m) => !order.includes(m.id));
    return [...first, ...rest];
  }, [listing.media, listing.custom_fields?.media_order]);

  const coverId =
    listing.custom_fields?.cover_media_id ??
    ordered.find((m) => m.file)?.id;

  async function persistOrder(ids: string[]) {
    try {
      await updateListing.mutateAsync({
        id: listing.id,
        custom_fields: {
          ...(listing.custom_fields ?? {}),
          media_order: ids,
          cover_media_id: listing.custom_fields?.cover_media_id,
        },
      } as never);
      qc.invalidateQueries({ queryKey: ["listings"] });
    } catch (e) {
      toast.error(apiError(e, "Could not reorder"));
    }
  }

  async function setCover(m: MediaItem) {
    const src = m.file || m.url;
    try {
      await Promise.all([
        updateListing.mutateAsync({
          id: listing.id,
          custom_fields: {
            ...(listing.custom_fields ?? {}),
            media_order: listing.custom_fields?.media_order,
            cover_media_id: m.id,
          },
        } as never),
        src
          ? updateProperty.mutateAsync({
              id: propertyId,
              custom_fields: { ...propertyFields, image_url: src },
            } as never)
          : Promise.resolve(),
      ]);
      toast.success("Cover image updated");
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
    } catch (e) {
      toast.error(apiError(e, "Could not set cover"));
    }
  }

  function move(id: string, dir: -1 | 1) {
    const ids = ordered.map((m) => m.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    persistOrder(ids);
  }

  async function upload(file?: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      if (caption.trim()) fd.append("caption", caption.trim());
      if (kind === "tour") {
        if (!tourUrl.trim()) {
          toast.error("Paste the tour URL");
          return;
        }
        fd.append("url", tourUrl.trim());
      } else if (file) {
        fd.append("file", file);
      } else {
        return;
      }
      await api.post(`/listings/${listing.id}/media/`, fd);
      toast.success("Media uploaded");
      setCaption("");
      setTourUrl("");
      qc.invalidateQueries({ queryKey: ["listings"] });
    } catch (e) {
      toast.error(apiError(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-3">
        <SelectField
          value={kind}
          onChange={setKind}
          options={MEDIA_KINDS}
          className="w-40"
        />
        <Input
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-48"
        />
        {kind === "tour" ? (
          <Input
            placeholder="https://tour-url…"
            value={tourUrl}
            onChange={(e) => setTourUrl(e.target.value)}
            className="w-64"
          />
        ) : null}
        {kind === "tour" ? (
          <Button onClick={() => upload()} disabled={uploading}>
            {uploading && <Loader2 className="size-4 animate-spin" />} Add tour link
          </Button>
        ) : (
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            Upload file
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={kind === "brochure" ? ".pdf,image/*" : "image/*"}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>

      {ordered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No media yet — upload photos, floor plans, or a brochure.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {ordered.map((m, idx) => (
            <figure key={m.id} className="overflow-hidden rounded-lg border border-border">
              {m.kind === "tour" || !m.file ? (
                <a
                  href={m.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-32 items-center justify-center bg-muted text-sm text-primary underline-offset-4 hover:underline"
                >
                  Open virtual tour
                </a>
              ) : (
                <img
                  src={m.file.startsWith("http") ? m.file : m.file}
                  alt={m.caption}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                />
              )}
              <figcaption className="space-y-1.5 px-2 py-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate">{m.caption || humanize(m.kind)}</span>
                  {coverId === m.id && (
                    <span className="flex items-center gap-0.5 text-warning">
                      <Star className="size-3 fill-current" /> Cover
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    disabled={idx === 0}
                    onClick={() => move(m.id, -1)}
                    aria-label="Move earlier"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    disabled={idx === ordered.length - 1}
                    onClick={() => move(m.id, 1)}
                    aria-label="Move later"
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                  {m.file && coverId !== m.id && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => setCover(m)}
                    >
                      Set cover
                    </Button>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

function OwnerMandatePanel({
  property,
  listing,
}: {
  property: Property;
  listing?: ListingFull;
}) {
  const qc = useQueryClient();
  const updateProperty = useUpdate("properties");
  const updateListing = useUpdate("listings");
  const contacts = useList<{ id: string; full_name: string; email: string }>("contacts", {
    page_size: 200,
  });
  const agents = useList<{ id: string; full_name: string; email: string }>("users", {
    page_size: 200,
    role: "agent",
  });
  const [ownerId, setOwnerId] = useState(property.owner ?? "");
  const [mandate, setMandate] = useState(listing?.mandate ?? "exclusive");
  const [coAgent, setCoAgent] = useState(listing?.co_listing_agent ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateProperty.mutateAsync({
        id: property.id,
        owner: ownerId || null,
      } as never);
      if (listing) {
        await updateListing.mutateAsync({
          id: listing.id,
          mandate,
          co_listing_agent: coAgent || null,
        } as never);
      }
      toast.success("Owner & mandate saved");
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
    } catch (e) {
      toast.error(apiError(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Owner &amp; mandate</h3>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Property owner (contact)</label>
        <SelectField
          value={ownerId}
          onChange={setOwnerId}
          placeholder="Select owner contact"
          options={(contacts.data?.results ?? []).map((c) => ({
            value: c.id,
            label: c.full_name || c.email,
          }))}
        />
      </div>
      {listing && (
        <>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Listing mandate</label>
            <SelectField value={mandate} onChange={setMandate} options={MANDATE_OPTIONS} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Co-listing agent</label>
            <SelectField
              value={coAgent}
              onChange={setCoAgent}
              placeholder="Optional co-agent"
              options={(agents.data?.results ?? []).map((a) => ({
                value: a.id,
                label: a.full_name || a.email,
              }))}
            />
          </div>
        </>
      )}
      <Button onClick={save} disabled={saving} size="sm">
        {saving && <Loader2 className="size-4 animate-spin" />} Save
      </Button>
    </div>
  );
}

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const property = useDetail<Property>("properties", id);
  const listings = useList<ListingFull>("listings", { property: id });
  const listing = useMemo(() => listings.data?.results?.[0], [listings.data]);
  const owner = useDetail<{ full_name: string; email: string; phone: string }>(
    "contacts",
    property.data?.owner ?? undefined,
  );

  if (property.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }
  if (!property.data) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Property not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/properties")}>
          <ArrowLeft className="size-4" /> Back to properties
        </Button>
      </div>
    );
  }

  const p = property.data;
  const coverFromMedia = listing?.media?.find(
    (m) => m.id === listing.custom_fields?.cover_media_id && m.file,
  )?.file;
  const hero =
    p.custom_fields?.image_url ||
    coverFromMedia ||
    listing?.media?.find((m) => m.file)?.file ||
    FALLBACK_IMG;

  return (
    <div>
      <button
        onClick={() => navigate("/properties")}
        className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Properties
      </button>

      <div className="relative mb-4 h-56 overflow-hidden rounded-xl bg-muted md:h-72">
        <img src={hero} alt={p.title} className="size-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              {listing && (
                <StatusBadge
                  value={listing.status}
                  tone={listingStatusTone[listing.status] ?? "muted"}
                  className="mb-2 shadow"
                />
              )}
              <h1 className="text-xl font-semibold text-white md:text-2xl">{p.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
                <MapPin className="size-4" />
                {[p.address_line, p.city, p.region].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
            {listing && (
              <p className="text-2xl font-bold tabular text-white">
                {money(listing.price, listing.currency)}
                <span className="ml-1 text-sm font-normal text-white/70">
                  {listing.listing_type === "rent" ? "/ mo" : ""}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="size-4" /> Edit property
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="listing">Listing &amp; status</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold">Facts</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4">
                {[
                  { icon: BedDouble, label: "Bedrooms", value: p.bedrooms ?? "—" },
                  { icon: Bath, label: "Bathrooms", value: p.bathrooms ?? "—" },
                  { icon: Ruler, label: "Built area", value: p.area_built ? `${p.area_built} m²` : "—" },
                  { icon: Building2, label: "Category", value: humanize(p.category) },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2">
                    <f.icon className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                      <p className="font-medium">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {p.description && (
                <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
                  {p.description}
                </p>
              )}
              {(p.amenities?.length ?? 0) > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.amenities!.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs"
                    >
                      {humanize(a)}
                    </span>
                  ))}
                </div>
              )}
              {p.latitude && p.longitude && (
                <div className="mt-4">
                  <h4 className="mb-2 text-xs font-medium text-muted-foreground">Map</h4>
                  <PropertyMapPane
                    lat={Number(p.latitude)}
                    lng={Number(p.longitude)}
                  />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Owner</h3>
                {p.owner ? (
                  owner.isLoading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{owner.data?.full_name || "—"}</p>
                      <p className="text-muted-foreground">{owner.data?.email || "—"}</p>
                      <p className="text-muted-foreground">{owner.data?.phone || "—"}</p>
                    </div>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">No owner linked yet.</p>
                )}
              </div>
              <OwnerMandatePanel property={p} listing={listing} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media">
          {listing ? (
            <MediaManager
              listing={listing}
              propertyId={p.id}
              propertyFields={(p.custom_fields as Record<string, unknown>) ?? {}}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Create a listing for this property to manage its media.
            </p>
          )}
        </TabsContent>

        <TabsContent value="listing">
          {listing ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">Status</h3>
                <ListingStatusControl propertyId={p.id} />
                <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium">{humanize(listing.listing_type)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mandate</p>
                    <p className="font-medium">{humanize(listing.mandate ?? "exclusive")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold tabular">{money(listing.price, listing.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Listed</p>
                    <p className="font-medium">{listing.listed_at ? relativeTime(listing.listed_at) : "—"}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Status history</h3>
                {listing.status_history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transitions recorded yet.</p>
                ) : (
                  <ol className="space-y-3">
                    {listing.status_history.map((h) => (
                      <li key={h.id} className="flex items-start gap-3 text-sm">
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                        <div>
                          <p>
                            {h.from_status ? humanize(h.from_status) : "Created"} →{" "}
                            <b>{humanize(h.to_status)}</b>
                          </p>
                          {h.reason && <p className="text-muted-foreground">{h.reason}</p>}
                          <p className="text-xs text-muted-foreground">{relativeTime(h.at)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              This property isn't listed yet. Edit it to create a listing.
            </p>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <ActivityTimeline objectId={p.id} />
        </TabsContent>
      </Tabs>

      {editing && (
        <PropertySheet property={p} open={editing} onOpenChange={setEditing} />
      )}
    </div>
  );
}
