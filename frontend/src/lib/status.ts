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
  | "muted";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-subtle text-success ring-success/25",
  warning: "bg-warning-subtle text-warning ring-warning/25",
  destructive: "bg-destructive-subtle text-destructive ring-destructive/25",
  info: "bg-info-subtle text-info ring-info/25",
  primary: "bg-primary-subtle text-primary ring-primary/25",
  muted: "bg-muted text-muted-foreground ring-border",
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
};

// Listing status matrix (design doc §3 — Property Listings).
export const listingStatusTone: Record<string, Tone> = {
  draft: "muted",
  active: "success",
  under_offer: "warning",
  reserved: "primary",
  sold: "primary",
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

export function humanize(value: string) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
