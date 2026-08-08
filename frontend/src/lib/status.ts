/**
 * Single source of truth for domain status → colour (design system §3).
 * Badge rule: soft pastel background (subtle) + dark saturated text + label.
 * Every StatusBadge reads from here so semantics stay consistent app-wide.
 */
export type Tone =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "primary"
  | "muted"
  | "under_offer"
  | "reserved";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-subtle text-success ring-success/25",
  warning: "bg-warning-subtle text-warning ring-warning/25",
  destructive: "bg-destructive-subtle text-destructive ring-destructive/25",
  info: "bg-info-subtle text-info ring-info/25",
  primary: "bg-primary-subtle text-primary ring-primary/25",
  muted: "bg-muted text-muted-foreground ring-border",
  under_offer: "bg-under-offer-subtle text-under-offer ring-under-offer/25",
  reserved: "bg-reserved-subtle text-reserved ring-reserved/25",
};

export function toneClass(tone: Tone) {
  return toneClasses[tone];
}

/** Dot colour for inline status indicators (e.g. Kanban, timelines). */
export const toneDot: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  primary: "bg-primary",
  muted: "bg-muted-foreground/50",
  under_offer: "bg-under-offer",
  reserved: "bg-reserved",
};

// Listing status matrix (design doc §3 — Property Listings).
export const listingStatusTone: Record<string, Tone> = {
  draft: "muted",
  active: "success",
  under_offer: "under_offer",
  reserved: "reserved",
  sold: "reserved",
  rented: "info",
  off_market: "muted",
  expired: "muted",
};

export const leadStatusTone: Record<string, Tone> = {
  new: "info",
  contacted: "primary",
  qualified: "warning",
  converted: "success",
  lost: "muted",
};

export const opportunityStatusTone: Record<string, Tone> = {
  open: "info",
  won: "success",
  lost: "destructive",
};

/** Resolve a tone for any known status string; never leave callers unmapped. */
export function toneForStatus(
  value: string | undefined | null,
  domain: "listing" | "lead" | "opportunity" = "lead",
): Tone {
  if (!value) return "muted";
  const key = value.toLowerCase();
  const map =
    domain === "listing"
      ? listingStatusTone
      : domain === "opportunity"
        ? opportunityStatusTone
        : leadStatusTone;
  return map[key] ?? "muted";
}

export function humanize(value: string) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
