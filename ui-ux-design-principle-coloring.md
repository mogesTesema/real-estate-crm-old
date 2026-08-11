# UI/UX Design System — Real Estate CRM

Production design system for the Real Estate CRM. Translates SRS requirements (Sections 4.1, 5.4) and role-based workflows into design tokens, component rules, and Tailwind configuration for the frontend team.

**Sources of truth**
- [`full-featured-web-based-real-estate-crm-srs.md`](full-featured-web-based-real-estate-crm-srs.md)
- [`Real-Estate-CRM-Role-Based-Dashboard Designs.md`](Real-Estate-CRM-Role-Based-Dashboard%20Designs.md)
- [`frontend-implimentation-plan.md`](frontend-implimentation-plan.md)

---

## 1. Core UI/UX Design Principles

### A. Data Density Management (Information Architecture)

Real estate CRMs fail when screens are cluttered with unorganized data.

- **Hierarchy Rule:** Use **60% Canvas** (soft off-whites), **30% Structure** (slates/borders), and **10% Action Accent** (brand blue / semantic status).
- **The "3-Second Scan" Rule:** An agent looking at a contact profile or property record must identify **Status**, **Owner**, **Budget/Price**, and **Next Action** within 3 seconds without scrolling.
- **Progressive Disclosure:** Hide complex fields (legal tax splits, historical audit logs, deep custom fields) behind expandable accordions or slide-over drawers.

### B. Contextual Scoping & Branch Indicators

In a multi-branch, role-based **single-company** system, users must always know **where** they are and **what scope** they are viewing (SRS 3.15, 3.17.2).

- **Global Header Badge:** Always display the active Branch/Company scope (e.g. `Branch: Dubai Downtown` or `Scope: My Leads Only`).
- **Visual Isolation:** Use clean structural dividers rather than heavy saturated backgrounds to separate branch/team scopes.

### C. Mobile-First Field UX (For Field Agents)

Agents are constantly on site visits, inspections, or client meetings (SRS 3.16).

- **Touch Targets:** Minimum **44×44px** on mobile viewports for all buttons, selects, and checkboxes.
- **Bottom Action Sheets:** Primary mobile actions (*Log Viewing Feedback*, *Click-to-Call*, *Upload Photo*) must anchor to the bottom of the screen within thumb reach.

### D. Accessibility & Contrast

- Conform to **WCAG 2.1 AA** for core workflows (SRS 5.4).
- Never use color alone to convey status — always pair with a text label and/or icon.
- Focus rings must be visible (`ring-2 ring-brand`).

---

## 2. Design Token Architecture (3-Tier)

```
Primitive (raw HSL) → Semantic (purpose) → Component (usage)
```

Tokens are HSL CSS variables so **light and dark mode** share the same Tailwind class names. Do **not** hardcode hex colors in components.

### A. CSS Variables (`src/index.css`)

```css
@layer base {
  :root {
    /* Surfaces */
    --background: 210 40% 98%;       /* #F8FAFC canvas */
    --foreground: 222 47% 11%;       /* #0F172A */
    --card: 0 0% 100%;               /* #FFFFFF */
    --card-foreground: 222 47% 11%;
    --muted: 210 40% 96%;            /* #F1F5F9 */
    --muted-foreground: 215 16% 47%; /* #64748B */
    --border: 214 32% 91%;           /* #E2E8F0 */
    --input: 214 32% 91%;
    --ring: 221 83% 53%;             /* brand focus */

    /* Brand — blue-600 */
    --primary: 221 83% 53%;          /* #2563EB */
    --primary-foreground: 0 0% 100%;
    --primary-hover: 224 76% 48%;    /* #1D4ED8 */
    --primary-subtle: 214 100% 97%;  /* #EFF6FF */

    /* Semantic status */
    --success: 142 76% 29%;          /* #15803D */
    --success-foreground: 0 0% 100%;
    --success-subtle: 142 76% 94%;   /* #DCFCE7 */
    --warning: 32 95% 44%;           /* #B45309 ≈ amber-700 */
    --warning-foreground: 0 0% 100%;
    --warning-subtle: 48 96% 89%;    /* #FEF3C7 */
    --destructive: 0 72% 51%;        /* #B91C1C */
    --destructive-foreground: 0 0% 100%;
    --destructive-subtle: 0 86% 97%; /* #FEE2E2 */
    --info: 199 89% 41%;             /* #0369A1 sky-700 */
    --info-foreground: 0 0% 100%;
    --info-subtle: 204 94% 94%;      /* #E0F2FE */

    /* Domain accents (entity identity, not status) */
    --entity-lead: 258 90% 66%;      /* purple */
    --entity-property: 199 89% 48%;  /* sky */
    --entity-deal: 221 83% 53%;      /* brand blue */
    --entity-lease: 160 84% 39%;     /* emerald */
    --entity-finance: 38 92% 50%;    /* amber */

    --radius: 0.5rem;
  }

  .dark {
    --background: 222 47% 8%;
    --foreground: 210 40% 96%;
    --card: 222 40% 11%;
    --card-foreground: 210 40% 96%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --border: 217 33% 20%;
    --input: 217 33% 22%;
    --ring: 221 83% 60%;

    --primary: 221 83% 60%;
    --primary-foreground: 222 47% 11%;
    --primary-hover: 224 76% 55%;
    --primary-subtle: 221 50% 18%;

    --success: 142 70% 42%;
    --success-subtle: 142 40% 16%;
    --warning: 38 90% 52%;
    --warning-subtle: 38 40% 16%;
    --destructive: 0 72% 58%;
    --destructive-subtle: 0 40% 16%;
    --info: 199 80% 55%;
    --info-subtle: 199 40% 16%;
  }
}
```

### B. Surface & Neutral System

| Token | Light Hex | Tailwind | Usage |
| :--- | :--- | :--- | :--- |
| `surface-canvas` | `#F8FAFC` | `bg-background` | App background behind cards, tables, sidebars |
| `surface-card` | `#FFFFFF` | `bg-card` | Cards, modals, drawers, dropdowns |
| `surface-subtle` | `#F1F5F9` | `bg-muted` | Table headers, disabled inputs, Kanban columns |
| `border-subtle` | `#E2E8F0` | `border-border` | Card outlines, row dividers, tab borders |
| `border-strong` | `#CBD5E1` | `border-input` | Form input borders, active tab borders |

### C. Typography & Text Contrast

| Token | Hex | Tailwind | Usage |
| :--- | :--- | :--- | :--- |
| `text-primary` | `#0F172A` | `text-foreground` | Headings, property titles, lead names, primary table data |
| `text-secondary` | `#475569` | `text-muted-foreground` | Labels, body, secondary metadata (sq ft, address) |
| `text-muted` | `#94A3B8` | `text-slate-400` / muted | Placeholders, timestamps, disabled labels |

**Baseline:** `14px` (`text-sm`) for data tables and forms. `12px` (`text-xs`) for badges and timestamps. Use tabular numerals (`tabular-nums`) for money and metrics.

**Fonts:** Inter Variable (UI), JetBrains Mono or Fira Code (IDs, financial figures).

### D. Brand & Interactive Accent

| Token | Hex | Tailwind | Usage |
| :--- | :--- | :--- | :--- |
| `brand-primary` | `#2563EB` | `bg-primary` | Primary CTAs (*Add Lead*, *Create Offer*), active nav |
| `brand-hover` | `#1D4ED8` | `hover:bg-primary-hover` | Hover on primary actions |
| `brand-subtle` | `#EFF6FF` | `bg-primary-subtle` | Selected row, active nav background |
| `brand-sidebar` | `#0F172A` | `bg-slate-900` (optional dark shell) | Optional dark sidebar variant |

---

## 3. Real Estate Domain Semantic Color Matrix

> **Badge rule:** Soft pastel background + dark saturated text + explicit text label/icon. Never color alone.

| Domain | Status | Text | BG | Tailwind | SRS Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pipeline** | Won / Closed | `#15803D` | `#DCFCE7` | `text-success bg-success-subtle` | Closed-Won, signed agreements |
| | In Negotiation | `#B45309` | `#FEF3C7` | `text-warning bg-warning-subtle` | Active offers, contract review |
| | Lost / Cancelled | `#B91C1C` | `#FEE2E2` | `text-destructive bg-destructive-subtle` | Lost deals, cancelled leases |
| **Listings** | Active | `#15803D` | `#DCFCE7` | `text-success bg-success-subtle` | Live on portals |
| | Under Offer | `#C2410C` | `#FFEDD5` | `text-orange-700 bg-orange-100` | Reservation pending |
| | Reserved / Sold | `#4338CA` | `#E0E7FF` | `text-indigo-700 bg-indigo-100` | Off-market / complete |
| | Rented | `#0369A1` | `#E0F2FE` | `text-info bg-info-subtle` | Leased units |
| | Draft / Expired / Off-Market | `#475569` | `#F1F5F9` | `text-muted-foreground bg-muted` | Unpublished / expired |
| **Maintenance** | New Request | `#0369A1` | `#E0F2FE` | `text-info bg-info-subtle` | Unassigned ticket |
| | In Progress | `#B45309` | `#FEF3C7` | `text-warning bg-warning-subtle` | Vendor assigned |
| | Completed | `#15803D` | `#DCFCE7` | `text-success bg-success-subtle` | Closed work order |
| **Finance & SLA** | Paid / Cleared | `#15803D` | `#DCFCE7` | `text-success bg-success-subtle` | Commission paid, rent collected |
| | Pending / Due | `#B45309` | `#FEF3C7` | `text-warning bg-warning-subtle` | Awaiting approval / due soon |
| | Overdue / SLA Breach | `#B91C1C` | `#FEE2E2` | `text-destructive bg-destructive-subtle` | Overdue rent, SLA > window |
| **Leads** | New | `#0369A1` | `#E0F2FE` | `text-info bg-info-subtle` | Fresh inbound |
| | Contacted / Qualified | `#2563EB` / `#B45309` | subtle | brand / warning | Working |
| | Converted | `#15803D` | `#DCFCE7` | success | Opportunity created |
| | Lost | `#475569` | `#F1F5F9` | muted | Closed without convert |

### Entity accent colors (nav icons, empty-state illustrations — not status badges)

| Entity | Accent | Hex |
| :--- | :--- | :--- |
| Lead | Purple | `#8B5CF6` |
| Property | Sky | `#0EA5E9` |
| Deal | Brand blue | `#2563EB` |
| Lease | Emerald | `#10B981` |
| Finance | Amber | `#F59E0B` |

---

## 4. Component-Level UI/UX Specifications

### A. Drag-and-Drop Kanban (Sales & Leasing Pipelines)

- **Column:** `bg-muted/70`, `rounded-xl`, `p-3`.
- **Header:** Sticky. Stage name + count pill (`bg-muted text-muted-foreground`) + aggregated column value (e.g. `$2.4M`).
- **Deal card:** `bg-card border-border shadow-card hover:shadow-md`. Header = deal name + property tag. Body = value (`text-primary font-bold tabular-nums`) + contact. Footer = agent avatar + days-in-stage (flag red if >14 days).
- **Drag feedback:** `rotate-2 shadow-xl border-primary scale-105`. Drop target: `border-2 border-dashed border-primary bg-primary-subtle/50`.

### B. High-Density Data Tables (Contacts, Listings, Invoices)

- **Header:** `bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground`. Sticky `top-0 z-10`.
- **Rows:** `h-12 border-b border-border/60 hover:bg-muted/50`.
- **Row click:** Opens a **450px right slide-over** (not a full-page navigation) for detail.
- **Actions:** Pin right. Ghost icon buttons for Call / Email / WhatsApp / Edit.
- **Required (SRS 4.1):** column config, sort, filter, **saved views**.

### C. Omnichannel Communication Timeline

| Channel | Left border | Background |
| :--- | :--- | :--- |
| WhatsApp | `border-l-4 border-emerald-500` | `bg-emerald-50/30` |
| Email | `border-l-4 border-blue-500` | `bg-blue-50/30` |
| Phone call | `border-l-4 border-purple-500` | `bg-purple-50/30` |
| Internal note | `border-l-4 border-amber-500` | `bg-amber-50/40` |

### D. Forms & Inputs

All inputs: `h-10 px-3 bg-card border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-primary`.

### E. Status Badges

```
rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1.5
```

Always use the semantic matrix above via a shared `StatusBadge` / tone map — never raw unstyled status strings.

### F. Skeleton Loaders

Replace full-page spinners with skeletons that match the exact dimensions of Kanban columns, table rows, and property cards.

---

## 5. Production Tailwind Configuration

Use CSS variables (not hardcoded hex in the theme). Example:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          subtle: "hsl(var(--primary-subtle))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          subtle: "hsl(var(--success-subtle))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          subtle: "hsl(var(--warning-subtle))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          subtle: "hsl(var(--destructive-subtle))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          subtle: "hsl(var(--info-subtle))",
        },
        entity: {
          lead: "hsl(var(--entity-lead))",
          property: "hsl(var(--entity-property))",
          deal: "hsl(var(--entity-deal))",
          lease: "hsl(var(--entity-lease))",
          finance: "hsl(var(--entity-finance))",
        },
      },
      fontFamily: {
        sans: ["'Inter Variable'", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        dropdown: "0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.05)",
        kanban: "0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.05)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
```

---

## 6. Frontend Team Execution Checklist

1. [ ] Wire CSS variables from Section 2 into `index.css` (light + `.dark`).
2. [ ] Point `tailwind.config` at those variables (Section 5).
3. [ ] Standardize table/form density at `text-sm` / `text-xs` for badges.
4. [ ] Enforce uniform inputs (`h-10`, focus ring on brand).
5. [ ] Build `StatusBadge` from the semantic matrix — no raw status strings in cells.
6. [ ] Implement skeleton loaders for Kanban, tables, and property cards.
7. [ ] Show **scope badge** in the global header on every authenticated screen.
8. [ ] Ensure 44×44px touch targets and bottom action sheets on mobile viewports.
9. [ ] Verify WCAG 2.1 AA contrast for primary text and status badges.
10. [ ] Ship DataTable with column config, sort, filter, and saved views (SRS 4.1).
