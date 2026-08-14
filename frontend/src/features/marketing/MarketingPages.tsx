import {
  BarChart3,
  Building2,
  CircleDollarSign,
  FileText,
  Globe,
  Mail,
  Plug,
  Radio,
  Settings,
  Target,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ModuleDashboard, Panel } from "../../components/ModuleDashboard";
import { Can } from "../../components/RequireRole";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import {
  useScopedDemoList,
  type DemoCampaign,
  type DemoEmailTemplate,
  type DemoLandingPage,
} from "../../lib/demo";
import { compactMoney } from "../../lib/format";
import { humanize } from "../../lib/status";

const SOCIAL_RE = /facebook|instagram|google/i;

function cpl(spend: number, leads: number) {
  return compactMoney(spend / Math.max(leads, 1));
}

function isSocial(c: DemoCampaign) {
  return SOCIAL_RE.test(c.channel);
}

export function LeadGenerationPage() {
  const campaigns = useScopedDemoList<DemoCampaign>("campaigns", { page_size: 100 });
  const landing = useScopedDemoList<DemoLandingPage>("landingPages", { page_size: 100 });
  const campRows = (campaigns.data?.results ?? []).filter((c) => c.leads > 0 || isSocial(c));
  const landRows = landing.data?.results ?? [];
  const campLeads = campRows.reduce((s, c) => s + Number(c.leads || 0), 0);
  const formLeads = landRows.reduce((s, p) => s + Number(p.submissions || 0), 0);

  return (
    <ModuleDashboard
      title="Lead Generation"
      description="Captures from ads, landing pages, and social — not the sales lead board."
      stats={[
        { label: "Campaign leads", value: campLeads, icon: Target, tone: "primary", loading: campaigns.isLoading },
        { label: "Form submissions", value: formLeads, icon: Globe, tone: "info", loading: landing.isLoading },
        { label: "Sources", value: campRows.length + landRows.length, icon: Radio, tone: "muted" },
      ]}
    >
      <Panel title="Capture queue" loading={campaigns.isLoading || landing.isLoading}>
        <ul className="divide-y divide-border text-sm">
          {campRows.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate">
                {c.name} · {c.channel}
              </span>
              <span className="flex items-center gap-3">
                <span className="tabular-nums">{c.leads} leads</span>
                <StatusBadge value={humanize(c.status)} tone={c.status === "active" ? "success" : "muted"} />
              </span>
            </li>
          ))}
          {landRows.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate">
                {p.title} · {p.kind}
              </span>
              <span className="tabular-nums">{p.submissions} submissions</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button variant="link" className="h-auto p-0" asChild>
            <Link to="/marketing/social/leads">Lead ads</Link>
          </Button>
          <Button variant="link" className="h-auto p-0" asChild>
            <Link to="/leads/sources">Source catalog</Link>
          </Button>
        </div>
      </Panel>
    </ModuleDashboard>
  );
}

export function CampaignPerformancePage() {
  const list = useScopedDemoList<DemoCampaign>("campaigns", { page_size: 100 });
  const rows = list.data?.results ?? [];
  const spend = rows.reduce((s, c) => s + Number(c.spend || 0), 0);
  const leads = rows.reduce((s, c) => s + Number(c.leads || 0), 0);

  return (
    <ModuleDashboard
      title="Campaign Performance"
      description="Spend, leads, and cost per lead from the demo campaign store."
      stats={[
        { label: "Spend", value: compactMoney(spend), icon: CircleDollarSign, tone: "warning", loading: list.isLoading },
        { label: "Leads", value: leads, icon: Users, tone: "info" },
        { label: "CPL", value: cpl(spend, leads), icon: Target, tone: "primary" },
      ]}
    >
      <Panel title="By campaign" loading={list.isLoading}>
        <ul className="divide-y divide-border text-sm">
          {rows.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate">{c.name}</span>
              <span className="tabular-nums">
                {c.leads} · {cpl(c.spend, c.leads)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function CreateEmailPage() {
  const templates = useScopedDemoList<DemoEmailTemplate>("emailTemplates", { page_size: 50 });
  const rows = templates.data?.results ?? [];
  const [picked, setPicked] = useState(rows[0]?.id ?? "");
  const selected = rows.find((t) => t.id === picked) ?? rows[0];

  return (
    <ModuleDashboard
      title="Create Email"
      description="Compose from a marketing template. Not the agent communications timeline."
      stats={[
        { label: "Templates", value: rows.length, icon: Mail, tone: "info", loading: templates.isLoading },
      ]}
      actions={
        <Can roles={["marketing", "super_admin"]}>
          <Button
            className="min-h-[44px]"
            onClick={() => toast.success(`Queued “${selected?.name ?? "email"}” (demo).`)}
          >
            Send demo blast
          </Button>
        </Can>
      }
    >
      <Panel title="Template" loading={templates.isLoading}>
        <label className="text-sm text-muted-foreground" htmlFor="mkt-tpl">
          Choose template
        </label>
        <select
          id="mkt-tpl"
          className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={selected?.id ?? ""}
          onChange={(e) => setPicked(e.target.value)}
        >
          {rows.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.channel}
            </option>
          ))}
        </select>
        {selected ? (
          <p className="mt-3 text-sm text-muted-foreground">Subject: {selected.subject}</p>
        ) : null}
      </Panel>
    </ModuleDashboard>
  );
}

export function EmailTrackingPage() {
  const templates = useScopedDemoList<DemoEmailTemplate>("emailTemplates", { page_size: 50 });
  const rows = templates.data?.results ?? [];
  const opens = rows.reduce((s, t) => s + Number(t.opens || 0), 0);
  const clicks = rows.reduce((s, t) => s + Number(t.clicks || 0), 0);

  return (
    <ModuleDashboard
      title="Open / Click Tracking"
      description="Engagement from marketing templates. Not a copy of the template list."
      stats={[
        { label: "Opens", value: opens, icon: Mail, tone: "success", loading: templates.isLoading },
        { label: "Clicks", value: clicks, icon: Target, tone: "primary" },
        { label: "Templates", value: rows.length, icon: FileText, tone: "muted" },
      ]}
    >
      <Panel title="By template" loading={templates.isLoading}>
        <ul className="divide-y divide-border text-sm">
          {rows.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate">{t.name}</span>
              <span className="tabular-nums">
                {t.opens} opens · {t.clicks} clicks
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function DripSequencesPage() {
  const campaigns = useScopedDemoList<DemoCampaign>("campaigns", { page_size: 100 });
  const templates = useScopedDemoList<DemoEmailTemplate>("emailTemplates", { page_size: 50 });
  const drip = (campaigns.data?.results ?? []).find((c) => /drip|nurture/i.test(c.name));
  const emailCamps = (campaigns.data?.results ?? []).filter((c) => /email|drip|nurture/i.test(`${c.channel} ${c.name}`));

  return (
    <ModuleDashboard
      title="Drip Sequences"
      description="Nurture steps tied to the Buyer Nurture Drip campaign. Not invented enrollment counts."
      stats={[
        { label: "Email campaigns", value: emailCamps.length, icon: Mail, tone: "success", loading: campaigns.isLoading },
        { label: "Enrolled", value: drip?.leads ?? 0, icon: Users, tone: "info" },
        { label: "Spend", value: compactMoney(drip?.spend ?? 0), icon: CircleDollarSign, tone: "warning" },
        { label: "Templates", value: templates.data?.results?.length ?? 0, icon: FileText, tone: "muted" },
      ]}
    >
      <Panel title={drip?.name ?? "Buyer Nurture Drip"}>
        <ol className="list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
          <li>Day 0 — Welcome + preference capture</li>
          <li>Day 2 — Matching listings digest</li>
          <li>Day 5 — Social proof / recent sales</li>
          <li>Day 10 — Soft CTA to book a viewing</li>
        </ol>
        <Button variant="link" className="mt-2 h-auto p-0" asChild>
          <Link to="/marketing/email/templates">Templates</Link>
        </Button>
      </Panel>
    </ModuleDashboard>
  );
}

export function SocialAdsPage() {
  const list = useScopedDemoList<DemoCampaign>("campaigns", { page_size: 100 });
  const rows = (list.data?.results ?? []).filter(isSocial);
  const spend = rows.reduce((s, c) => s + Number(c.spend || 0), 0);
  const leads = rows.reduce((s, c) => s + Number(c.leads || 0), 0);

  return (
    <ModuleDashboard
      title="Ad Campaigns"
      description="Facebook, Instagram, and Google ads only. Not the full campaign ledger."
      stats={[
        { label: "Social ads", value: rows.length, icon: Globe, tone: "info", loading: list.isLoading },
        { label: "Spend", value: compactMoney(spend), icon: CircleDollarSign, tone: "warning" },
        { label: "Leads", value: leads, icon: Users, tone: "success" },
        { label: "CPL", value: cpl(spend, leads), icon: Target, tone: "primary" },
      ]}
    >
      <Panel title="Social rows" loading={list.isLoading}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No social-channel campaigns in the demo store.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {rows.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <span className="truncate">
                  {c.name} · {c.channel}
                </span>
                <span className="tabular-nums">{c.leads} · {compactMoney(c.spend)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}

export function SocialLeadsPage() {
  const list = useScopedDemoList<DemoCampaign>("campaigns", { page_size: 100 });
  const rows = (list.data?.results ?? []).filter(isSocial);
  const leads = rows.reduce((s, c) => s + Number(c.leads || 0), 0);
  const spend = rows.reduce((s, c) => s + Number(c.spend || 0), 0);
  const live = rows.filter((c) => c.status === "active").length;

  return (
    <ModuleDashboard
      title="Lead Ads Capture"
      description="Facebook / Instagram / Google lead-ad intake from campaign rows."
      stats={[
        { label: "Forms live", value: live, icon: Target, tone: "success", loading: list.isLoading },
        { label: "Leads", value: leads, icon: Users, tone: "info" },
        { label: "Cost / lead", value: cpl(spend, leads), icon: CircleDollarSign, tone: "warning" },
      ]}
    >
      <Panel title="Synced ads" loading={list.isLoading}>
        <ul className="divide-y divide-border text-sm">
          {rows.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate">{c.name}</span>
              <span className="tabular-nums">{c.leads} leads</span>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function SocialRoiPage() {
  const list = useScopedDemoList<DemoCampaign>("campaigns", { page_size: 100 });
  const rows = (list.data?.results ?? []).filter(isSocial);
  const spend = rows.reduce((s, c) => s + Number(c.spend || 0), 0);
  const leads = rows.reduce((s, c) => s + Number(c.leads || 0), 0);

  return (
    <ModuleDashboard
      title="Social ROI Tracking"
      description="Social spend versus captured leads. Not agency GCI."
      stats={[
        { label: "Social spend", value: compactMoney(spend), icon: CircleDollarSign, tone: "warning", loading: list.isLoading },
        { label: "Social leads", value: leads, icon: Users, tone: "info" },
        { label: "CPL", value: cpl(spend, leads), icon: Target, tone: "primary" },
      ]}
    />
  );
}

export function MicrositesPage() {
  const list = useScopedDemoList<DemoLandingPage>("landingPages", { page_size: 100 });
  const rows = (list.data?.results ?? []).filter((p) => p.kind === "microsite");
  const views = rows.reduce((s, p) => s + Number(p.views || 0), 0);
  const subs = rows.reduce((s, p) => s + Number(p.submissions || 0), 0);

  return (
    <ModuleDashboard
      title="Property Microsites"
      description="Listing microsites only. Not the full landing-page catalog."
      stats={[
        { label: "Microsites", value: rows.length, icon: Building2, tone: "info", loading: list.isLoading },
        { label: "Views", value: views, icon: BarChart3, tone: "primary" },
        { label: "Submissions", value: subs, icon: Users, tone: "success" },
      ]}
    >
      <Panel title="Pages" loading={list.isLoading}>
        <ul className="divide-y divide-border text-sm">
          {rows.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate">
                {p.title} · /{p.slug}
              </span>
              <span className="tabular-nums">{p.submissions} leads</span>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function WebsiteAnalyticsPage() {
  const list = useScopedDemoList<DemoLandingPage>("landingPages", { page_size: 100 });
  const rows = list.data?.results ?? [];
  const views = rows.reduce((s, p) => s + Number(p.views || 0), 0);
  const subs = rows.reduce((s, p) => s + Number(p.submissions || 0), 0);
  const top = [...rows].sort((a, b) => b.views - a.views)[0];
  const cvr = views ? `${((subs / views) * 100).toFixed(1)}%` : "0%";

  return (
    <ModuleDashboard
      title="Website Analytics"
      description="Demo-store views and form conversion from landing pages and microsites."
      stats={[
        { label: "Views", value: views, icon: BarChart3, tone: "info", loading: list.isLoading },
        { label: "Submissions", value: subs, icon: Users, tone: "success" },
        { label: "Form CVR", value: cvr, icon: Target, tone: "primary" },
        { label: "Top page", value: top?.title ?? "—", icon: Building2, tone: "muted" },
      ]}
    />
  );
}

export function MarketingRoiPage() {
  const campaigns = useScopedDemoList<DemoCampaign>("campaigns", { page_size: 100 });
  const rows = campaigns.data?.results ?? [];
  const byChannel = new Map<string, { spend: number; leads: number }>();
  for (const c of rows) {
    const cur = byChannel.get(c.channel) ?? { spend: 0, leads: 0 };
    cur.spend += Number(c.spend || 0);
    cur.leads += Number(c.leads || 0);
    byChannel.set(c.channel, cur);
  }
  const spend = rows.reduce((s, c) => s + Number(c.spend || 0), 0);
  const leads = rows.reduce((s, c) => s + Number(c.leads || 0), 0);

  return (
    <ModuleDashboard
      title="Lead Source ROI"
      description="Cost per lead by campaign channel. Opens the source catalog without the agent lead board."
      stats={[
        { label: "Spend", value: compactMoney(spend), icon: CircleDollarSign, tone: "warning", loading: campaigns.isLoading },
        { label: "Leads", value: leads, icon: Users, tone: "info" },
        { label: "CPL", value: cpl(spend, leads), icon: Target, tone: "primary" },
      ]}
    >
      <Panel title="By channel" loading={campaigns.isLoading}>
        <ul className="divide-y divide-border text-sm">
          {[...byChannel.entries()].map(([channel, v]) => (
            <li key={channel} className="flex items-center justify-between gap-3 py-3">
              <span>{channel}</span>
              <span className="tabular-nums">
                {v.leads} · {cpl(v.spend, v.leads)}
              </span>
            </li>
          ))}
        </ul>
        <Button variant="link" className="mt-2 h-auto p-0" asChild>
          <Link to="/leads/sources">Source catalog</Link>
        </Button>
      </Panel>
    </ModuleDashboard>
  );
}

export function CampaignBudgetPage() {
  const list = useScopedDemoList<DemoCampaign>("campaigns", { page_size: 100 });
  const rows = list.data?.results ?? [];
  const budget = rows.reduce((s, c) => s + Number(c.budget || 0), 0);
  const spend = rows.reduce((s, c) => s + Number(c.spend || 0), 0);

  return (
    <ModuleDashboard
      title="Campaign Budget"
      description="Spend versus budget by campaign. Not finance P&L."
      stats={[
        { label: "Budget", value: compactMoney(budget), icon: CircleDollarSign, tone: "info", loading: list.isLoading },
        { label: "Spend", value: compactMoney(spend), icon: CircleDollarSign, tone: "warning" },
        { label: "Remaining", value: compactMoney(Math.max(budget - spend, 0)), icon: Target, tone: "success" },
      ]}
    >
      <Panel title="By campaign" loading={list.isLoading}>
        <ul className="divide-y divide-border text-sm">
          {rows.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate">{c.name}</span>
              <span className="tabular-nums">
                {compactMoney(c.spend)} / {compactMoney(c.budget)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function IntegrationsPage() {
  return (
    <ModuleDashboard
      title="Integrations"
      description="Marketing connectors for email, ads, and analytics. Super Admin owns API keys."
      stats={[
        { label: "Email", value: "Mailgun (demo)", icon: Mail, tone: "info" },
        { label: "Ads", value: "Meta + Google", icon: Globe, tone: "primary" },
        { label: "Analytics", value: "Not connected", icon: Plug, tone: "muted" },
      ]}
    >
      <Panel title="How connectors work">
        <p className="text-sm text-muted-foreground">
          Marketing uses company email/SMS and ad-platform connectors. Key vault and webhook CRUD stay on the Super
          Admin integrations screens.
        </p>
      </Panel>
    </ModuleDashboard>
  );
}

export function BrandSettingsPage() {
  return (
    <ModuleDashboard
      title="Brand Settings"
      description="Brand consistency for campaigns and landing pages. Legal logo/letterhead stays Super Admin company profile."
      stats={[
        { label: "Primary", value: "EstateCRM", icon: Settings, tone: "primary" },
        { label: "Voice", value: "Professional", icon: FileText, tone: "info" },
        { label: "Applies to", value: "Campaigns + pages", icon: Target, tone: "muted" },
      ]}
    >
      <Panel title="What Marketing edits">
        <p className="text-sm text-muted-foreground">
          Use this workspace to keep templates and microsites on-brand. Company legal name, logo file, and primary
          color persist under Super Admin / Owner org config in Round 2.
        </p>
      </Panel>
    </ModuleDashboard>
  );
}

export function ContentPage() {
  return (
    <ModuleDashboard
      title="Content"
      description="Property descriptions, newsletters, and listing copy. Not listing CRUD."
      stats={[
        { label: "Newsletters", value: 2, icon: Mail, tone: "info" },
        { label: "Listing blurbs", value: 5, icon: FileText, tone: "primary" },
      ]}
    >
      <Panel title="Drafts">
        <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
          <li>Marina Tower — lifestyle intro (microsite)</li>
          <li>August buyer newsletter — new listings digest</li>
          <li>Off-plan Bay Phase 2 — payment-plan explainer</li>
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function SegmentsPage() {
  return (
    <ModuleDashboard
      title="Segmentation"
      description="Audience segments for drips and ads (SRS 3.2.3). Not the agent contact book."
      stats={[
        { label: "Segments", value: 3, icon: Users, tone: "info" },
        { label: "Used by", value: "Drips + ads", icon: Target, tone: "primary" },
      ]}
    >
      <Panel title="Demo segments">
        <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
          <li>First-time buyers — email nurture</li>
          <li>Marina interest — Facebook lookalike</li>
          <li>Inactive 30 days — SMS re-engage</li>
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function SeoPage() {
  return (
    <ModuleDashboard
      title="SEO / public portal"
      description="Public property search SEO (SRS 3.11.1). Portal-user records stay on /portal/*."
      stats={[
        { label: "Index", value: "Public listings", icon: Globe, tone: "info" },
        { label: "Sitemap", value: "Demo", icon: FileText, tone: "muted" },
      ]}
    >
      <Panel title="Scope">
        <p className="text-sm text-muted-foreground">
          Marketing owns public listing titles, meta, and microsite slugs. Do not open portal client deals or tenant
          leases from this screen.
        </p>
      </Panel>
    </ModuleDashboard>
  );
}
