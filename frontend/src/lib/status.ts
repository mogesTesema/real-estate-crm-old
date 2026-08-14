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

export const leaseStatusTone: Record<string, Tone> = {
  draft: "muted",
  active: "success",
  expiring: "warning",
  renewed: "info",
  terminated: "destructive",
  pending_signature: "warning",
  expired: "muted",
};

export const maintenanceStatusTone: Record<string, Tone> = {
  new: "info",
  assigned: "primary",
  in_progress: "warning",
  waiting_for_parts: "warning",
  completed: "success",
  cancelled: "muted",
};

export const financeStatusTone: Record<string, Tone> = {
  draft: "muted",
  issued: "info",
  partially_paid: "warning",
  paid: "success",
  overdue: "destructive",
  void: "muted",
  posted: "success",
  reversed: "muted",
  refunded: "warning",
  calculated: "info",
  pending_approval: "warning",
  approved: "primary",
  rejected: "destructive",
  pending: "warning",
  completed: "success",
  cancelled: "muted",
};

export const campaignStatusTone: Record<string, Tone> = {
  draft: "muted",
  active: "success",
  paused: "warning",
  completed: "info",
};

export const auditStatusTone: Record<string, Tone> = {
  login: "info",
  update: "primary",
  export: "warning",
  backup: "success",
  gps_track_view: "primary",
  permission_change: "warning",
  commission_approved: "success",
  create: "info",
  delete: "destructive",
};

/** Platform / governance statuses: backups, tickets, security, org, webhooks. */
export const systemStatusTone: Record<string, Tone> = {
  success: "success",
  healthy: "success",
  failed: "destructive",
  failing: "destructive",
  running: "info",
  open: "warning",
  in_progress: "info",
  resolved: "success",
  closed: "muted",
  required: "success",
  enabled: "info",
  disabled: "muted",
  active: "success",
  inactive: "muted",
  high: "destructive",
  medium: "warning",
  low: "muted",
  verified: "success",
  connected: "success",
  pending: "warning",
  approved: "success",
  compliant: "success",
  missing: "destructive",
  investigating: "info",
};

const DOMAIN_MAPS = {
  listing: listingStatusTone,
  lead: leadStatusTone,
  opportunity: opportunityStatusTone,
  lease: leaseStatusTone,
  maintenance: maintenanceStatusTone,
  finance: financeStatusTone,
  campaign: campaignStatusTone,
  audit: auditStatusTone,
  system: systemStatusTone,
} as const;

export type StatusDomain = keyof typeof DOMAIN_MAPS;

/** Resolve a tone for any known status string; never leave callers unmapped. */
export function toneForStatus(
  value: string | undefined | null,
  domain: StatusDomain = "lead",
): Tone {
  if (!value) return "muted";
  const key = value.toLowerCase();
  return DOMAIN_MAPS[domain][key] ?? "muted";
}

export function humanize(value: string) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
