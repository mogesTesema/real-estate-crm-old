/** Frontend demo fixtures for modules without a backend — showcase data. */

export type DemoId = string;

function id(prefix: string, n: number): DemoId {
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

const daysFromNow = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 36e5).toISOString();

export interface DemoLease {
  id: DemoId;
  reference: string;
  property: string;
  unit: string;
  tenant: string;
  landlord: string;
  start_date: string;
  end_date: string;
  rent: number;
  status: "active" | "expiring" | "renewed" | "terminated" | "draft";
  manager: string;
  /** Demo identity that "owns" this row for isolation (see lib/demo/access.ts). */
  ownerEmail?: string;
  /** Which side of the lease `ownerEmail` represents — distinguishes the portal
   *  user's own tenancy ("My Lease") from a property they let out ("My Property"). */
  leaseRole?: "tenant" | "landlord";
}

export interface DemoTenant {
  id: DemoId;
  name: string;
  email: string;
  phone: string;
  property: string;
  lease_status: string;
  move_in: string;
}

export interface DemoInvoice {
  id: DemoId;
  number: string;
  contact: string;
  type: string;
  amount: number;
  tax: number;
  due_date: string;
  status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "void";
  ownerEmail?: string;
}

export interface DemoPayment {
  id: DemoId;
  reference: string;
  payer: string;
  amount: number;
  method: string;
  date: string;
  status: "posted" | "reversed" | "refunded";
  ownerEmail?: string;
}

export interface DemoWorkOrder {
  id: DemoId;
  title: string;
  property: string;
  priority: "low" | "medium" | "high" | "emergency";
  status: "new" | "assigned" | "in_progress" | "waiting_for_parts" | "completed" | "cancelled";
  vendor: string;
  cost: number;
  requested_at: string;
  ownerEmail?: string;
}

export interface DemoVendor {
  id: DemoId;
  name: string;
  category: string;
  phone: string;
  rating: number;
  active: boolean;
}

export interface DemoCommission {
  id: DemoId;
  agent: string;
  deal: string;
  gross: number;
  net: number;
  status: "calculated" | "pending_approval" | "approved" | "rejected" | "paid";
  period: string;
  ownerEmail?: string;
}

export interface DemoTransaction {
  id: DemoId;
  reference: string;
  type: string;
  amount: number;
  date: string;
  status: "pending" | "completed" | "cancelled";
  account: string;
}

export interface DemoCampaign {
  id: DemoId;
  name: string;
  channel: string;
  status: "draft" | "active" | "paused" | "completed";
  budget: number;
  leads: number;
  spend: number;
  start_date: string;
}

export interface DemoEmailTemplate {
  id: DemoId;
  name: string;
  subject: string;
  channel: "email" | "sms" | "whatsapp";
  opens: number;
  clicks: number;
}

export interface DemoLandingPage {
  id: DemoId;
  title: string;
  slug: string;
  views: number;
  submissions: number;
  published: boolean;
  kind: "landing" | "microsite";
}

export interface DemoMessage {
  id: DemoId;
  channel: "email" | "sms" | "whatsapp" | "call" | "note";
  direction: "inbound" | "outbound";
  contact: string;
  subject: string;
  body: string;
  at: string;
  status: string;
  ownerEmail?: string;
}

export interface DemoDocument {
  id: DemoId;
  title: string;
  type: string;
  status: string;
  shared: boolean;
  updated_at: string;
  ownerEmail?: string;
}

export interface DemoCalendarEvent {
  id: DemoId;
  title: string;
  type: "viewing" | "task" | "meeting" | "inspection";
  start: string;
  end: string;
  contact: string;
  property: string;
  status: string;
  ownerEmail?: string;
}

export interface DemoPortalDeal {
  id: DemoId;
  title: string;
  property: string;
  amount: number;
  status: "active" | "offer" | "closed" | "lost";
  updated_at: string;
  ownerEmail?: string;
}

export interface DemoFavorite {
  id: DemoId;
  title: string;
  price: number;
  beds: number;
  city: string;
  status: string;
  ownerEmail?: string;
}

export interface DemoSavedSearch {
  id: DemoId;
  name: string;
  criteria: string;
  matches: number;
  frequency: string;
  ownerEmail?: string;
}

export interface DemoOwnerStatement {
  id: DemoId;
  property: string;
  period: string;
  rent_collected: number;
  fees: number;
  net: number;
  status: "draft" | "issued" | "paid";
  ownerEmail?: string;
}

export interface DemoAuditEvent {
  id: DemoId;
  actor: string;
  action: string;
  entity: string;
  at: string;
  ip: string;
}

export interface DemoTenantAccount {
  id: DemoId;
  name: string;
  plan: string;
  users: number;
  status: "active" | "trial" | "suspended";
  mrr: number;
}

export interface DemoSubscription {
  id: DemoId;
  customer: string;
  plan: string;
  amount: number;
  status: "active" | "past_due" | "cancelled";
  renews: string;
}

export interface DemoApiKey {
  id: DemoId;
  name: string;
  prefix: string;
  created_at: string;
  last_used: string;
}

export interface DemoWebhook {
  id: DemoId;
  url: string;
  events: string;
  status: "active" | "failing" | "disabled";
}

export interface DemoCompanyProfile {
  id: DemoId;
  name: string;
  legal_name: string;
  registration_number: string;
  tax_number: string;
  email: string;
  phone: string;
  timezone: string;
  default_currency: string;
  fx_mode: string;
  country: string;
  status: "active";
}

export interface DemoOrgUnit {
  id: DemoId;
  name: string;
  code: string;
  type: "branch" | "team";
  parent: string;
  manager: string;
  members: number;
  status: "active" | "inactive";
}

export interface DemoSupportTicket {
  id: DemoId;
  subject: string;
  requester: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  updated_at: string;
}

export interface DemoBackupJob {
  id: DemoId;
  type: string;
  started_at: string;
  finished_at: string;
  size: string;
  status: "success" | "running" | "failed";
}

export interface DemoSecuritySetting {
  id: DemoId;
  name: string;
  value: string;
  status: "enabled" | "disabled" | "required";
}

export interface DemoAgentRow {
  id: DemoId;
  name: string;
  email: string;
  deals: number;
  gci: number;
  conversion: number;
  status: "active" | "inactive" | "pending";
}

export interface DemoVipClient {
  id: DemoId;
  name: string;
  email: string;
  kind: "buyer" | "seller" | "investor";
  value: number;
  referral: string;
  vip: boolean;
}

export interface DemoCommissionPlan {
  id: DemoId;
  name: string;
  type: string;
  rate: string;
  active: boolean;
}

export interface DemoBrokerOwner {
  id: DemoId;
  name: string;
  email: string;
  agency: string;
  agents: number;
  status: "pending" | "approved" | "active";
}

export interface DemoFieldSession {
  id: DemoId;
  agent: string;
  activity: string;
  started_at: string;
  ended_at: string;
  points: number;
  status: "compliant" | "missing" | "active";
  ownerEmail?: string;
}

export interface DemoAgentConflict {
  id: DemoId;
  subject: string;
  agents: string;
  related: string;
  status: "open" | "investigating" | "resolved";
  updated_at: string;
}

export const FIXTURES = {
  leases: [
    {
      id: id("lease", 1),
      reference: "L-1001",
      property: "Marina Tower",
      unit: "1204",
      tenant: "Sara Khan",
      landlord: "Perry Portal",
      start_date: daysFromNow(-200),
      end_date: daysFromNow(45),
      rent: 8500,
      status: "expiring",
      manager: "Pat Property",
      ownerEmail: "portal@demo.test",
      leaseRole: "landlord",
    },
    {
      id: id("lease", 2),
      reference: "L-1002",
      property: "Riverside Villa",
      unit: "Whole",
      tenant: "Perry Portal",
      landlord: "Demo Realty",
      start_date: daysFromNow(-90),
      end_date: daysFromNow(275),
      rent: 12000,
      status: "active",
      manager: "Pat Property",
      ownerEmail: "portal@demo.test",
      leaseRole: "tenant",
    },
    {
      id: id("lease", 6),
      reference: "L-1006",
      property: "Palm Heights",
      unit: "14B",
      tenant: "Tessa Tenant",
      landlord: "Demo Realty",
      start_date: daysFromNow(-120),
      end_date: daysFromNow(245),
      rent: 9500,
      status: "active",
      manager: "Pat Property",
      ownerEmail: "tenant@demo.test",
      leaseRole: "tenant",
    },
    {
      id: id("lease", 7),
      reference: "L-1007",
      property: "Creek Wharf",
      unit: "3A",
      tenant: "Nadia Hassan",
      landlord: "Larry Landlord",
      start_date: daysFromNow(-180),
      end_date: daysFromNow(185),
      rent: 11000,
      status: "active",
      manager: "Pat Property",
      ownerEmail: "landlord@demo.test",
      leaseRole: "landlord",
    },
    {
      id: id("lease", 3),
      reference: "L-1003",
      property: "Business Bay Office",
      unit: "504",
      tenant: "Chen Trading LLC",
      landlord: "Bay Assets",
      start_date: daysFromNow(-400),
      end_date: daysFromNow(-10),
      rent: 22000,
      status: "terminated",
      manager: "Pat Property",
    },
    {
      id: id("lease", 4),
      reference: "L-1004",
      property: "Uptown Residences",
      unit: "802",
      tenant: "Aisha Al-Farsi",
      landlord: "Omar Holdings",
      start_date: daysFromNow(14),
      end_date: daysFromNow(379),
      rent: 7200,
      status: "draft",
      manager: "Pat Property",
    },
    {
      id: id("lease", 5),
      reference: "L-1005",
      property: "Marina Tower",
      unit: "905",
      tenant: "David Okoro",
      landlord: "Omar Holdings",
      start_date: daysFromNow(-365),
      end_date: daysFromNow(0),
      rent: 9100,
      status: "renewed",
      manager: "Pat Property",
    },
  ] as DemoLease[],

  tenants: [
    {
      id: id("tenant", 1),
      name: "Sara Khan",
      email: "sara.k@example.com",
      phone: "+971 50 111 2201",
      property: "Marina Tower · 1204",
      lease_status: "expiring",
      move_in: daysFromNow(-200),
    },
    {
      id: id("tenant", 2),
      name: "Perry Portal",
      email: "portal@demo.test",
      phone: "+971 50 111 2202",
      property: "Riverside Villa",
      lease_status: "active",
      move_in: daysFromNow(-90),
    },
    {
      id: id("tenant", 5),
      name: "Tessa Tenant",
      email: "tenant@demo.test",
      phone: "+971 50 111 2205",
      property: "Palm Heights · 14B",
      lease_status: "active",
      move_in: daysFromNow(-120),
    },
    {
      id: id("tenant", 3),
      name: "Aisha Al-Farsi",
      email: "aisha.a@example.com",
      phone: "+971 50 111 2203",
      property: "Uptown Residences · 802",
      lease_status: "draft",
      move_in: daysFromNow(14),
    },
    {
      id: id("tenant", 4),
      name: "David Okoro",
      email: "david.o@example.com",
      phone: "+971 50 111 2204",
      property: "Marina Tower · 905",
      lease_status: "renewed",
      move_in: daysFromNow(-365),
    },
  ] as DemoTenant[],

  /** Finance's agency-wide AR ledger — never rent (see rentInvoices for Property Manager). */
  invoices: [
    {
      id: id("inv", 3),
      number: "INV-2403",
      contact: "Chen Trading LLC",
      type: "Commission",
      amount: 45000,
      tax: 2250,
      due_date: daysFromNow(-20),
      status: "paid",
    },
    {
      id: id("inv", 4),
      number: "INV-2404",
      contact: "Omar Holdings",
      type: "Management fee",
      amount: 3200,
      tax: 160,
      due_date: daysFromNow(3),
      status: "partially_paid",
    },
    {
      id: id("inv", 5),
      number: "INV-2405",
      contact: "Demo Realty Client",
      type: "Sale",
      amount: 18000,
      tax: 900,
      due_date: daysFromNow(20),
      status: "draft",
    },
    {
      id: id("inv", 6),
      number: "INV-2406",
      contact: "Bay Assets",
      type: "Sale",
      amount: 62000,
      tax: 3100,
      due_date: daysFromNow(7),
      status: "issued",
    },
    {
      id: id("inv", 7),
      number: "INV-2407",
      contact: "Uptown Holdings",
      type: "Commission",
      amount: 14500,
      tax: 725,
      due_date: daysFromNow(-8),
      status: "overdue",
    },
  ] as DemoInvoice[],

  /** Property Manager's rent roll — isolated from Finance's `invoices` ledger. */
  rentInvoices: [
    {
      id: id("rent", 1),
      number: "RINV-2401",
      contact: "Sara Khan",
      type: "Rent",
      amount: 8500,
      tax: 425,
      due_date: daysFromNow(-5),
      status: "overdue",
    },
    {
      id: id("rent", 2),
      number: "RINV-2402",
      contact: "Perry Portal",
      type: "Rent",
      amount: 12000,
      tax: 600,
      due_date: daysFromNow(10),
      status: "issued",
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("rent", 3),
      number: "RINV-2403",
      contact: "Tessa Tenant",
      type: "Rent",
      amount: 9500,
      tax: 475,
      due_date: daysFromNow(-3),
      status: "overdue",
      ownerEmail: "tenant@demo.test",
    },
  ] as DemoInvoice[],

  payments: [
    {
      id: id("pay", 1),
      reference: "PAY-901",
      payer: "Chen Trading LLC",
      amount: 47250,
      method: "Bank transfer",
      date: daysFromNow(-18),
      status: "posted",
    },
    {
      id: id("pay", 2),
      reference: "PAY-902",
      payer: "Omar Holdings",
      amount: 1600,
      method: "Cheque",
      date: daysFromNow(-2),
      status: "posted",
    },
    {
      id: id("pay", 3),
      reference: "PAY-903",
      payer: "Perry Portal",
      amount: 12000,
      method: "Card",
      date: daysFromNow(-30),
      status: "posted",
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("pay", 4),
      reference: "PAY-904",
      payer: "Tessa Tenant",
      amount: 9500,
      method: "Card",
      date: daysFromNow(-32),
      status: "posted",
      ownerEmail: "tenant@demo.test",
    },
  ] as DemoPayment[],

  workOrders: [
    {
      id: id("wo", 1),
      title: "AC not cooling — Unit 1204",
      property: "Marina Tower",
      priority: "high",
      status: "in_progress",
      vendor: "CoolAir Services",
      cost: 450,
      requested_at: hoursAgo(30),
    },
    {
      id: id("wo", 2),
      title: "Leaking faucet",
      property: "Riverside Villa",
      priority: "medium",
      status: "assigned",
      vendor: "FixIt Plumbing",
      cost: 120,
      requested_at: hoursAgo(8),
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("wo", 5),
      title: "Stuck balcony door — Palm 14B",
      property: "Palm Heights",
      priority: "medium",
      status: "new",
      vendor: "—",
      cost: 0,
      requested_at: hoursAgo(6),
      ownerEmail: "tenant@demo.test",
    },
    {
      id: id("wo", 3),
      title: "Broken lobby light",
      property: "Uptown Residences",
      priority: "low",
      status: "new",
      vendor: "—",
      cost: 0,
      requested_at: hoursAgo(2),
    },
    {
      id: id("wo", 4),
      title: "Elevator emergency stop",
      property: "Marina Tower",
      priority: "emergency",
      status: "completed",
      vendor: "LiftCare Co",
      cost: 2100,
      requested_at: hoursAgo(72),
    },
  ] as DemoWorkOrder[],

  vendors: [
    {
      id: id("ven", 1),
      name: "CoolAir Services",
      category: "HVAC",
      phone: "+971 4 555 0101",
      rating: 4.6,
      active: true,
    },
    {
      id: id("ven", 2),
      name: "FixIt Plumbing",
      category: "Plumbing",
      phone: "+971 4 555 0102",
      rating: 4.2,
      active: true,
    },
    {
      id: id("ven", 3),
      name: "LiftCare Co",
      category: "Elevators",
      phone: "+971 4 555 0103",
      rating: 4.9,
      active: true,
    },
    {
      id: id("ven", 4),
      name: "GreenScape",
      category: "Landscaping",
      phone: "+971 4 555 0104",
      rating: 3.8,
      active: false,
    },
  ] as DemoVendor[],

  commissions: [
    {
      id: id("com", 1),
      agent: "Sarah Khan",
      deal: "OPP-Marina-Sale",
      gross: 42000,
      net: 33600,
      status: "pending_approval",
      period: "Aug 2026",
      ownerEmail: "agent1@demo.test",
    },
    {
      id: id("com", 2),
      agent: "James Smith",
      deal: "OPP-Villa-Closing",
      gross: 28500,
      net: 22800,
      status: "approved",
      period: "Jul 2026",
      ownerEmail: "agent2@demo.test",
    },
    {
      id: id("com", 3),
      agent: "Aisha Al-Farsi",
      deal: "OPP-Bay-Lease",
      gross: 9600,
      net: 7680,
      status: "paid",
      period: "Jul 2026",
      ownerEmail: "agent3@demo.test",
    },
    {
      id: id("com", 4),
      agent: "Omar Johnson",
      deal: "OPP-Uptown-Sale",
      gross: 51000,
      net: 40800,
      status: "calculated",
      period: "Aug 2026",
      ownerEmail: "agent4@demo.test",
    },
  ] as DemoCommission[],

  transactions: [
    {
      id: id("txn", 1),
      reference: "TXN-501",
      type: "Commission payout",
      amount: 7680,
      date: daysFromNow(-12),
      status: "completed",
      account: "Operating",
    },
    {
      id: id("txn", 2),
      reference: "TXN-502",
      type: "Rent receipt",
      amount: 12000,
      date: daysFromNow(-5),
      status: "completed",
      account: "Trust",
    },
    {
      id: id("txn", 3),
      reference: "TXN-503",
      type: "Owner remittance",
      amount: 9800,
      date: daysFromNow(2),
      status: "pending",
      account: "Trust",
    },
    {
      id: id("txn", 4),
      reference: "TXN-504",
      type: "Vendor payment",
      amount: 2100,
      date: daysFromNow(-1),
      status: "completed",
      account: "Operating",
    },
    {
      id: id("txn", 5),
      reference: "TXN-505",
      type: "Sale installment",
      amount: 150000,
      date: daysFromNow(14),
      status: "pending",
      account: "Clearing",
    },
    {
      id: id("txn", 6),
      reference: "TXN-506",
      type: "Off-plan milestone",
      amount: 85000,
      date: daysFromNow(45),
      status: "pending",
      account: "Clearing",
    },
  ] as DemoTransaction[],

  campaigns: [
    {
      id: id("camp", 1),
      name: "Marina Summer Launch",
      channel: "Facebook + Instagram",
      status: "active",
      budget: 12000,
      leads: 86,
      spend: 7400,
      start_date: daysFromNow(-40),
    },
    {
      id: id("camp", 2),
      name: "Buyer Nurture Drip",
      channel: "Email",
      status: "active",
      budget: 2000,
      leads: 34,
      spend: 450,
      start_date: daysFromNow(-60),
    },
    {
      id: id("camp", 3),
      name: "Google Search — Villas",
      channel: "Google Ads",
      status: "paused",
      budget: 8000,
      leads: 41,
      spend: 5100,
      start_date: daysFromNow(-90),
    },
    {
      id: id("camp", 4),
      name: "Open House WhatsApp",
      channel: "WhatsApp",
      status: "completed",
      budget: 500,
      leads: 22,
      spend: 380,
      start_date: daysFromNow(-120),
    },
    {
      id: id("camp", 5),
      name: "Palm Q4 Launch",
      channel: "Property portals",
      status: "draft",
      budget: 18000,
      leads: 0,
      spend: 0,
      start_date: daysFromNow(7),
    },
  ] as DemoCampaign[],

  emailTemplates: [
    {
      id: id("tpl", 1),
      name: "New listing alert",
      subject: "A new home matching your search",
      channel: "email",
      opens: 420,
      clicks: 88,
    },
    {
      id: id("tpl", 2),
      name: "Viewing confirmation",
      subject: "You're confirmed for {{property}}",
      channel: "email",
      opens: 210,
      clicks: 45,
    },
    {
      id: id("tpl", 3),
      name: "Follow-up SMS",
      subject: "Quick check-in on your search",
      channel: "sms",
      opens: 0,
      clicks: 12,
    },
    {
      id: id("tpl", 4),
      name: "WhatsApp soft pitch",
      subject: "Saw this and thought of you",
      channel: "whatsapp",
      opens: 0,
      clicks: 31,
    },
  ] as DemoEmailTemplate[],

  landingPages: [
    {
      id: id("lp", 1),
      title: "Marina Tower Microsite",
      slug: "marina-tower",
      views: 4200,
      submissions: 118,
      published: true,
      kind: "microsite",
    },
    {
      id: id("lp", 2),
      title: "First-time buyer guide",
      slug: "first-home",
      views: 1800,
      submissions: 64,
      published: true,
      kind: "landing",
    },
    {
      id: id("lp", 3),
      title: "Off-plan Bay Phase 2",
      slug: "bay-phase-2",
      views: 320,
      submissions: 9,
      published: false,
      kind: "microsite",
    },
  ] as DemoLandingPage[],

  messages: [
    {
      id: id("msg", 1),
      channel: "whatsapp",
      direction: "inbound",
      contact: "Sara Khan",
      subject: "Re: Marina viewing",
      body: "Can we move the viewing to 5pm?",
      at: hoursAgo(1),
      status: "received",
      ownerEmail: "agent1@demo.test",
    },
    {
      id: id("msg", 2),
      channel: "email",
      direction: "outbound",
      contact: "James Smith",
      subject: "Offer pack attached",
      body: "Please find the offer documents for Riverside Villa.",
      at: hoursAgo(4),
      status: "delivered",
      ownerEmail: "agent2@demo.test",
    },
    {
      id: id("msg", 3),
      channel: "call",
      direction: "outbound",
      contact: "Aisha Al-Farsi",
      subject: "Qualification call",
      body: "Spoke 12m — budget confirmed AED 1.2M, timeline immediate.",
      at: hoursAgo(8),
      status: "connected",
      ownerEmail: "agent3@demo.test",
    },
    {
      id: id("msg", 4),
      channel: "sms",
      direction: "outbound",
      contact: "Omar Johnson",
      subject: "Reminder",
      body: "Reminder: property inspection tomorrow at 10:00.",
      at: hoursAgo(20),
      status: "sent",
      ownerEmail: "agent4@demo.test",
    },
    {
      id: id("msg", 5),
      channel: "note",
      direction: "outbound",
      contact: "Sara Khan",
      subject: "Internal note",
      body: "@manager Hot lead — escalate if no reply by EOD.",
      at: hoursAgo(2),
      status: "logged",
      ownerEmail: "agent1@demo.test",
    },
    {
      id: id("msg", 6),
      channel: "email",
      direction: "inbound",
      contact: "Pat Property",
      subject: "Lease welcome pack",
      body: "Your Riverside Villa lease documents are in the portal.",
      at: hoursAgo(12),
      status: "received",
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("msg", 7),
      channel: "sms",
      direction: "outbound",
      contact: "Pat Property",
      subject: "Rent reminder",
      body: "RINV-2403 is overdue. Pay from My Lease → Payments.",
      at: hoursAgo(5),
      status: "sent",
      ownerEmail: "tenant@demo.test",
    },
    {
      id: id("msg", 8),
      channel: "email",
      direction: "inbound",
      contact: "Pat Property",
      subject: "July statement",
      body: "Creek Wharf July remittance is ready to view.",
      at: hoursAgo(40),
      status: "received",
      ownerEmail: "landlord@demo.test",
    },
    {
      id: id("msg", 9),
      channel: "whatsapp",
      direction: "inbound",
      contact: "Sarah Agent",
      subject: "Offer received",
      body: "Seller countered on Downtown studio — review in My Deals.",
      at: hoursAgo(3),
      status: "received",
      ownerEmail: "buyer@demo.test",
    },
  ] as DemoMessage[],

  documents: [
    {
      id: id("doc", 1),
      title: "Sale agreement — Marina 1204",
      type: "Sale contract",
      status: "signed",
      shared: true,
      updated_at: hoursAgo(10),
    },
    {
      id: id("doc", 2),
      title: "Lease — Riverside Villa",
      type: "Lease",
      status: "pending_signature",
      shared: true,
      updated_at: hoursAgo(28),
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("doc", 5),
      title: "Lease — Palm Heights 14B",
      type: "Lease",
      status: "signed",
      shared: true,
      updated_at: hoursAgo(80),
      ownerEmail: "tenant@demo.test",
    },
    {
      id: id("doc", 6),
      title: "Owner agreement — Creek Wharf 3A",
      type: "Management agreement",
      status: "signed",
      shared: true,
      updated_at: hoursAgo(200),
      ownerEmail: "landlord@demo.test",
    },
    {
      id: id("doc", 7),
      title: "Sale contract — Downtown studio",
      type: "Sale contract",
      status: "pending_signature",
      shared: true,
      updated_at: hoursAgo(16),
      ownerEmail: "buyer@demo.test",
    },
    {
      id: id("doc", 3),
      title: "Offer template (residential)",
      type: "Template",
      status: "active",
      shared: false,
      updated_at: hoursAgo(120),
    },
    {
      id: id("doc", 4),
      title: "ID — Sara Khan",
      type: "ID document",
      status: "verified",
      shared: false,
      updated_at: hoursAgo(200),
    },
  ] as DemoDocument[],

  calendar: [
    {
      id: id("cal", 1),
      title: "Viewing — Marina Tower 1204",
      type: "viewing",
      start: hoursAgo(-5),
      end: hoursAgo(-4),
      contact: "Sara Khan",
      property: "Marina Tower",
      status: "scheduled",
      ownerEmail: "agent1@demo.test",
    },
    {
      id: id("cal", 2),
      title: "Follow up hot lead",
      type: "task",
      start: hoursAgo(-2),
      end: hoursAgo(-1.5),
      contact: "James Smith",
      property: "—",
      status: "open",
      ownerEmail: "agent2@demo.test",
    },
    {
      id: id("cal", 3),
      title: "Move-in inspection",
      type: "inspection",
      start: hoursAgo(-26),
      end: hoursAgo(-24),
      contact: "Aisha Al-Farsi",
      property: "Uptown Residences",
      status: "scheduled",
      ownerEmail: "agent3@demo.test",
    },
    {
      id: id("cal", 4),
      title: "Client meeting — offer review",
      type: "meeting",
      start: hoursAgo(-48),
      end: hoursAgo(-47),
      contact: "Omar Johnson",
      property: "Business Bay",
      status: "completed",
      ownerEmail: "agent4@demo.test",
    },
    {
      id: id("cal", 5),
      title: "Move-in inspection — Riverside Villa",
      type: "inspection",
      start: hoursAgo(-30),
      end: hoursAgo(-29),
      contact: "Perry Portal",
      property: "Riverside Villa",
      status: "scheduled",
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("cal", 6),
      title: "AC follow-up — Palm Heights 14B",
      type: "inspection",
      start: hoursAgo(-20),
      end: hoursAgo(-19),
      contact: "Tessa Tenant",
      property: "Palm Heights",
      status: "scheduled",
      ownerEmail: "tenant@demo.test",
    },
    {
      id: id("cal", 7),
      title: "Owner meeting — Creek Wharf",
      type: "meeting",
      start: hoursAgo(-72),
      end: hoursAgo(-71),
      contact: "Larry Landlord",
      property: "Creek Wharf",
      status: "scheduled",
      ownerEmail: "landlord@demo.test",
    },
    {
      id: id("cal", 8),
      title: "Viewing — Downtown studio",
      type: "viewing",
      start: hoursAgo(-8),
      end: hoursAgo(-7),
      contact: "Bella Buyer",
      property: "Downtown Studio",
      status: "scheduled",
      ownerEmail: "buyer@demo.test",
    },
  ] as DemoCalendarEvent[],

  portalDeals: [
    {
      id: id("pdeal", 1),
      title: "Marina apartment offer",
      property: "Marina Tower 1204",
      amount: 1450000,
      status: "offer",
      updated_at: hoursAgo(6),
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("pdeal", 2),
      title: "Riverside villa search",
      property: "Riverside Villa",
      amount: 0,
      status: "active",
      updated_at: hoursAgo(30),
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("pdeal", 3),
      title: "Closed — Downtown loft",
      property: "Downtown Loft 3B",
      amount: 980000,
      status: "closed",
      updated_at: hoursAgo(400),
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("pdeal", 4),
      title: "Downtown studio offer",
      property: "Downtown Studio 8F",
      amount: 720000,
      status: "offer",
      updated_at: hoursAgo(4),
      ownerEmail: "buyer@demo.test",
    },
    {
      id: id("pdeal", 5),
      title: "Closed — Jumeirah townhouse",
      property: "Jumeirah Townhouse 2",
      amount: 2100000,
      status: "closed",
      updated_at: hoursAgo(500),
      ownerEmail: "buyer@demo.test",
    },
  ] as DemoPortalDeal[],

  favorites: [
    {
      id: id("fav", 1),
      title: "3BR Apartment, Marina",
      price: 1450000,
      beds: 3,
      city: "Marina",
      status: "active",
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("fav", 2),
      title: "4BR Villa, Riverside",
      price: 3200000,
      beds: 4,
      city: "Riverside",
      status: "under_offer",
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("fav", 3),
      title: "2BR Townhouse, Uptown",
      price: 890000,
      beds: 2,
      city: "Uptown",
      status: "active",
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("fav", 4),
      title: "Studio, Downtown",
      price: 720000,
      beds: 0,
      city: "Downtown",
      status: "under_offer",
      ownerEmail: "buyer@demo.test",
    },
    {
      id: id("fav", 5),
      title: "2BR Apartment, JBR",
      price: 1100000,
      beds: 2,
      city: "JBR",
      status: "active",
      ownerEmail: "buyer@demo.test",
    },
  ] as DemoFavorite[],

  savedSearches: [
    {
      id: id("ss", 1),
      name: "Marina 2–3BR under 1.5M",
      criteria: "Marina · 2–3 beds · ≤ AED 1.5M",
      matches: 7,
      frequency: "daily",
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("ss", 2),
      name: "Villas near Riverside",
      criteria: "Riverside · Villa · ≥ 4 beds",
      matches: 3,
      frequency: "weekly",
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("ss", 3),
      name: "Downtown studios under 800k",
      criteria: "Downtown · Studio · ≤ AED 800k",
      matches: 4,
      frequency: "daily",
      ownerEmail: "buyer@demo.test",
    },
    {
      id: id("ss", 4),
      name: "JBR 2BR sea view",
      criteria: "JBR · 2 beds · sea view",
      matches: 2,
      frequency: "weekly",
      ownerEmail: "buyer@demo.test",
    },
  ] as DemoSavedSearch[],

  ownerStatements: [
    {
      id: id("ost", 1),
      property: "Marina Tower",
      period: "Jul 2026",
      rent_collected: 17600,
      fees: 1760,
      net: 15240,
      status: "paid",
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("ost", 2),
      property: "Riverside Villa",
      period: "Jul 2026",
      rent_collected: 12000,
      fees: 1200,
      net: 10200,
      status: "issued",
    },
    {
      id: id("ost", 3),
      property: "Marina Tower",
      period: "Aug 2026",
      rent_collected: 8500,
      fees: 850,
      net: 7200,
      status: "draft",
      ownerEmail: "portal@demo.test",
    },
    {
      id: id("ost", 4),
      property: "Creek Wharf",
      period: "Jul 2026",
      rent_collected: 11000,
      fees: 1100,
      net: 9900,
      status: "paid",
      ownerEmail: "landlord@demo.test",
    },
  ] as DemoOwnerStatement[],

  auditEvents: [
    {
      id: id("aud", 1),
      actor: "Alex Morgan",
      action: "LOGIN",
      entity: "Session",
      at: hoursAgo(1),
      ip: "203.0.113.10",
    },
    {
      id: id("aud", 2),
      actor: "Sarah Khan",
      action: "UPDATE",
      entity: "Lead LEAD-012",
      at: hoursAgo(3),
      ip: "203.0.113.22",
    },
    {
      id: id("aud", 3),
      actor: "Finn Finance",
      action: "COMMISSION_APPROVED",
      entity: "Commission COM-002",
      at: hoursAgo(8),
      ip: "203.0.113.40",
    },
    {
      id: id("aud", 4),
      actor: "Sam Super",
      action: "EXPORT",
      entity: "Users CSV",
      at: hoursAgo(24),
      ip: "203.0.113.1",
    },
    {
      id: id("aud", 5),
      actor: "Sam Super",
      action: "GPS_TRACK_VIEW",
      entity: "Field session SES-014",
      at: hoursAgo(2),
      ip: "203.0.113.1",
    },
    {
      id: id("aud", 6),
      actor: "Sam Super",
      action: "PERMISSION_CHANGE",
      entity: "Role agent",
      at: hoursAgo(6),
      ip: "203.0.113.1",
    },
    {
      id: id("aud", 7),
      actor: "System",
      action: "BACKUP",
      entity: "Nightly snapshot",
      at: hoursAgo(14),
      ip: "127.0.0.1",
    },
  ] as DemoAuditEvent[],

  tenantsAccounts: [
    {
      id: id("ten", 1),
      name: "Demo Realty",
      plan: "Professional",
      users: 12,
      status: "active",
      mrr: 899,
    },
    {
      id: id("ten", 2),
      name: "Gulf Homes LLC",
      plan: "Enterprise",
      users: 48,
      status: "active",
      mrr: 2499,
    },
    {
      id: id("ten", 3),
      name: "Sunrise Brokers",
      plan: "Starter",
      users: 4,
      status: "trial",
      mrr: 0,
    },
    {
      id: id("ten", 4),
      name: "Atlas Estates",
      plan: "Professional",
      users: 9,
      status: "suspended",
      mrr: 0,
    },
  ] as DemoTenantAccount[],

  subscriptions: [
    {
      id: id("sub", 1),
      customer: "Demo Realty",
      plan: "Professional",
      amount: 899,
      status: "active",
      renews: daysFromNow(18),
    },
    {
      id: id("sub", 2),
      customer: "Gulf Homes LLC",
      plan: "Enterprise",
      amount: 2499,
      status: "active",
      renews: daysFromNow(5),
    },
    {
      id: id("sub", 3),
      customer: "Atlas Estates",
      plan: "Professional",
      amount: 899,
      status: "past_due",
      renews: daysFromNow(-3),
    },
  ] as DemoSubscription[],

  apiKeys: [
    {
      id: id("key", 1),
      name: "Production API",
      prefix: "esk_live_9f2a…",
      created_at: daysFromNow(-120),
      last_used: hoursAgo(2),
    },
    {
      id: id("key", 2),
      name: "Zapier connector",
      prefix: "esk_live_3bc1…",
      created_at: daysFromNow(-40),
      last_used: hoursAgo(26),
    },
  ] as DemoApiKey[],

  webhooks: [
    {
      id: id("wh", 1),
      url: "https://hooks.example.com/estate/leads",
      events: "lead.created, lead.converted",
      status: "active",
    },
    {
      id: id("wh", 2),
      url: "https://hooks.example.com/estate/deals",
      events: "deal.won, deal.lost",
      status: "failing",
    },
  ] as DemoWebhook[],

  companyProfile: [
    {
      id: id("co", 1),
      name: "Demo Realty",
      legal_name: "Demo Realty LLC",
      registration_number: "CR-88421",
      tax_number: "TAX-55201",
      email: "ops@demo.test",
      phone: "+971 4 555 0100",
      timezone: "Asia/Dubai",
      default_currency: "AED",
      fx_mode: "SINGLE_CURRENCY",
      country: "United Arab Emirates",
      status: "active",
    },
  ] as DemoCompanyProfile[],

  orgUnits: [
    {
      id: id("br", 1),
      name: "Downtown Branch",
      code: "DT",
      type: "branch",
      parent: "Demo Realty",
      manager: "Maya Manager",
      members: 8,
      status: "active",
    },
    {
      id: id("br", 2),
      name: "Marina Branch",
      code: "MR",
      type: "branch",
      parent: "Demo Realty",
      manager: "Omar Johnson",
      members: 5,
      status: "active",
    },
    {
      id: id("tm", 1),
      name: "Sales Team A",
      code: "SA",
      type: "team",
      parent: "Downtown Branch",
      manager: "Sarah Khan",
      members: 4,
      status: "active",
    },
    {
      id: id("tm", 2),
      name: "Leasing Team",
      code: "LT",
      type: "team",
      parent: "Marina Branch",
      manager: "Aisha Al-Farsi",
      members: 3,
      status: "active",
    },
  ] as DemoOrgUnit[],

  supportTickets: [
    {
      id: id("tkt", 1),
      subject: "SSO login loop for finance users",
      requester: "Finn Finance",
      priority: "high",
      status: "open",
      updated_at: hoursAgo(3),
    },
    {
      id: id("tkt", 2),
      subject: "Need extra WhatsApp sender ID",
      requester: "Mia Marketing",
      priority: "medium",
      status: "in_progress",
      updated_at: hoursAgo(8),
    },
    {
      id: id("tkt", 3),
      subject: "Backup restore dry-run request",
      requester: "Alex Morgan",
      priority: "low",
      status: "resolved",
      updated_at: hoursAgo(30),
    },
  ] as DemoSupportTicket[],

  backups: [
    {
      id: id("bak", 1),
      type: "Nightly full",
      started_at: hoursAgo(14),
      finished_at: hoursAgo(13.5),
      size: "2.4 GB",
      status: "success",
    },
    {
      id: id("bak", 2),
      type: "Hourly WAL",
      started_at: hoursAgo(1),
      finished_at: hoursAgo(0.9),
      size: "180 MB",
      status: "success",
    },
  ] as DemoBackupJob[],

  securitySettings: [
    { id: id("sec", 1), name: "MFA required", value: "All staff", status: "required" },
    { id: id("sec", 2), name: "Password policy", value: "12 chars, mixed", status: "enabled" },
    { id: id("sec", 3), name: "IP allowlist", value: "Office + VPN", status: "enabled" },
    { id: id("sec", 4), name: "Session timeout", value: "30 minutes", status: "enabled" },
  ] as DemoSecuritySetting[],

  agents: [
    {
      id: id("agt", 1),
      name: "Sarah Khan",
      email: "agent1@demo.test",
      deals: 6,
      gci: 128000,
      conversion: 28,
      status: "active",
    },
    {
      id: id("agt", 2),
      name: "James Smith",
      email: "agent2@demo.test",
      deals: 4,
      gci: 92000,
      conversion: 22,
      status: "active",
    },
    {
      id: id("agt", 3),
      name: "Aisha Al-Farsi",
      email: "agent3@demo.test",
      deals: 5,
      gci: 110000,
      conversion: 31,
      status: "active",
    },
    {
      id: id("agt", 4),
      name: "Omar Johnson",
      email: "agent4@demo.test",
      deals: 2,
      gci: 41000,
      conversion: 14,
      status: "inactive",
    },
    {
      id: id("agt", 5),
      name: "Lina Rahman",
      email: "agent5@demo.test",
      deals: 0,
      gci: 0,
      conversion: 0,
      status: "pending",
    },
  ] as DemoAgentRow[],

  vipClients: [
    {
      id: id("vip", 1),
      name: "Hassan Al-Maktoum",
      email: "hassan.vip@example.com",
      kind: "investor",
      value: 4200000,
      referral: "Downtown Realty board",
      vip: true,
    },
    {
      id: id("vip", 2),
      name: "Elena Rossi",
      email: "elena.rossi@example.com",
      kind: "buyer",
      value: 1850000,
      referral: "Sarah Khan",
      vip: true,
    },
    {
      id: id("vip", 3),
      name: "Marina Holdings",
      email: "acquisitions@marinaholdings.example",
      kind: "seller",
      value: 9100000,
      referral: "",
      vip: true,
    },
  ] as DemoVipClient[],

  commissionPlans: [
    {
      id: id("cpl", 1),
      name: "Standard residential",
      type: "Flat percent",
      rate: "2.5%",
      active: true,
    },
    {
      id: id("cpl", 2),
      name: "Tiered top performer",
      type: "Tiered",
      rate: "2% → 3.5%",
      active: true,
    },
    {
      id: id("cpl", 3),
      name: "Lease placement",
      type: "Fixed amount",
      rate: "AED 4,000",
      active: true,
    },
  ] as DemoCommissionPlan[],

  brokerOwners: [
    {
      id: id("own", 1),
      name: "Alex Morgan",
      email: "owner@demo.test",
      agency: "Downtown Realty",
      agents: 5,
      status: "active",
    },
    {
      id: id("own", 2),
      name: "Nora Haddad",
      email: "nora.owner@demo.test",
      agency: "Marina Desk",
      agents: 2,
      status: "pending",
    },
  ] as DemoBrokerOwner[],

  fieldSessions: [
    {
      id: id("gps", 1),
      agent: "Sarah Khan",
      activity: "Viewing — Marina Tower 12B",
      started_at: hoursAgo(3),
      ended_at: hoursAgo(2.2),
      points: 18,
      status: "compliant",
      ownerEmail: "agent1@demo.test",
    },
    {
      id: id("gps", 2),
      agent: "James Smith",
      activity: "Sale visit — Downtown Loft",
      started_at: hoursAgo(8),
      ended_at: hoursAgo(7),
      points: 0,
      status: "missing",
      ownerEmail: "agent2@demo.test",
    },
    {
      id: id("gps", 3),
      agent: "Aisha Al-Farsi",
      activity: "Open house — Creek Residences",
      started_at: hoursAgo(26),
      ended_at: hoursAgo(24),
      points: 42,
      status: "compliant",
      ownerEmail: "agent3@demo.test",
    },
  ] as DemoFieldSession[],

  agentConflicts: [
    {
      id: id("cfl", 1),
      subject: "Lead claimed by two agents",
      agents: "Sarah Khan · James Smith",
      related: "Lead LEAD-012",
      status: "open",
      updated_at: hoursAgo(5),
    },
    {
      id: id("cfl", 2),
      subject: "Split dispute on closed deal",
      agents: "Aisha Al-Farsi · Omar Johnson",
      related: "Deal OPP-008",
      status: "investigating",
      updated_at: hoursAgo(20),
    },
    {
      id: id("cfl", 3),
      subject: "Territory overlap — Marina",
      agents: "Sarah Khan · Aisha Al-Farsi",
      related: "Listing PL-044",
      status: "resolved",
      updated_at: hoursAgo(48),
    },
  ] as DemoAgentConflict[],
};

export type DemoResource = keyof typeof FIXTURES;
