/**
 * Single source of truth for domain status → colour (plan §2 design system).
 * Every StatusBadge reads from here so colour semantics are consistent app-wide.
 */
export type Tone = "success" | "warning" | "destructive" | "info" | "primary" | "muted";

const toneClasses: Record<Tone, string> = {
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/10 text-warning ring-warning/20",
  destructive: "bg-destructive/10 text-destructive ring-destructive/20",
  info: "bg-info/10 text-info ring-info/20",
  primary: "bg-primary/10 text-primary ring-primary/20",
  muted: "bg-muted text-muted-foreground ring-border",
};

export function toneClass(tone: Tone) {
  return toneClasses[tone];
}

export const listingStatusTone: Record<string, Tone> = {
  draft: "muted",
  active: "success",
  under_offer: "warning",
  reserved: "info",
  sold: "primary",
  rented: "info",
  off_market: "muted",
  expired: "destructive",
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
