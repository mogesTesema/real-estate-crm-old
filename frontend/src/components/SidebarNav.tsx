import { ChevronRight, LayoutDashboard, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";

import { cn } from "../lib/cn";
import type { NavGroup, NavItem } from "../lib/roles";

function itemMatchesPath(item: NavItem, pathname: string): boolean {
  const pathOnly = item.to.split("?")[0];
  if (item.end || pathOnly === "/") return pathname === pathOnly;
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

function groupContainsPath(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => itemMatchesPath(item, pathname));
}

const FALLBACK_GROUP_ICON: LucideIcon = LayoutDashboard;

export function SidebarNav({
  groups,
  collapsible,
  onNavigate,
}: {
  groups: NavGroup[];
  /** Independent expand/collapse: click opens, click again closes. Other groups stay as they are. */
  collapsible?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const activeLabel = groups.find((g) => groupContainsPath(g, location.pathname))?.label ?? null;
  const [openLabels, setOpenLabels] = useState<string[]>([]);

  function toggleGroup(label: string) {
    setOpenLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }

  if (!collapsible) {
    return (
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`sections.${g.label}`, g.label)}
            </p>
            <div className="space-y-0.5">
              {g.items.map((n) => (
                <NavItemLink key={n.to + n.label} item={n} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map((g) => {
        const open = openLabels.includes(g.label);
        const current = g.label === activeLabel;
        const Icon = g.icon ?? FALLBACK_GROUP_ICON;
        const panelId = `nav-section-${g.label.replace(/\s+/g, "-").toLowerCase()}`;
        return (
          <div key={g.label} className="rounded-lg">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggleGroup(g.label)}
              className={cn(
                "flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                current
                  ? "text-primary hover:bg-primary-subtle"
                  : "text-foreground hover:bg-muted hover:text-foreground",
                open && !current && "bg-muted/70",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate text-left">{t(`sections.${g.label}`, g.label)}</span>
              <ChevronRight
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  open && "rotate-90 text-primary",
                )}
                aria-hidden
              />
            </button>
            <div
              id={panelId}
              role="region"
              hidden={!open}
              className="ml-5 mt-0.5 space-y-0.5 border-l border-border py-1 pl-2"
            >
              {g.items.map((n) => (
                <NavItemLink key={n.to + n.label} item={n} onNavigate={onNavigate} nested />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NavItemLink({
  item,
  onNavigate,
  nested,
}: {
  item: NavItem;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const { t } = useTranslation();
  const to = item.to;
  const pathOnly = to.split("?")[0];
  return (
    <NavLink
      to={to}
      end={item.end ?? pathOnly === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          nested && "min-h-[40px] py-1.5",
          isActive
            ? "bg-primary-subtle text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      {t(`nav.${item.label}`, item.label)}
    </NavLink>
  );
}
