import {
  Building2,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "../lib/cn";
import { useAuth } from "../lib/auth";
import { humanize } from "../lib/status";
import { useTheme } from "../lib/theme";
import { navForRole } from "../lib/roles";
import { CommandPalette } from "./CommandPalette";
import { GlobalSearch } from "./GlobalSearch";
import { MobileFab } from "./MobileFab";
import { NotificationCenter } from "./NotificationCenter";
import { ScopeBadge } from "./ScopeBadge";

const SECTION_ORDER = ["Overview", "CRM", "Insights", "System"] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { me, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [search, setSearch] = useState(false);

  const groups = useMemo(() => {
    const items = navForRole(me?.role);
    return SECTION_ORDER.map((section) => ({
      section,
      items: items.filter((n) => n.section === section),
    })).filter((g) => g.items.length > 0);
  }, [me?.role]);

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <span className="font-semibold">
            Estate<span className="text-primary">CRM</span>
          </span>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Main">
          {groups.map((g) => (
            <div key={g.section}>
              {g.section !== "Overview" && (
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(`sections.${g.section}`, g.section)}
                </p>
              )}
              <div className="space-y-0.5">
                {g.items.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end ?? n.to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "bg-primary-subtle text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )
                    }
                  >
                    <n.icon className="size-4" aria-hidden />
                    {t(`nav.${n.label}`, n.label)}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>

          <ScopeBadge />

          <button
            onClick={() => setSearch(true)}
            className="hidden h-8 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex md:w-56 lg:w-64"
          >
            <Search className="size-3.5" />
            <span className="flex-1 text-left">Search records…</span>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSearch(true)}
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-muted-foreground lg:inline-flex"
              onClick={() => setPalette(true)}
            >
              <kbd className="rounded border border-border bg-muted px-1.5 text-[10px] font-medium">
                ⌘K
              </kbd>
            </Button>
            <NotificationCenter />
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-ring">
                  <Avatar name={me?.full_name || me?.email || "?"} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium">{me?.full_name || me?.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {me?.role ? humanize(me.role) : ""}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 pb-24 lg:p-6 lg:pb-6">{children}</main>
      </div>

      <CommandPalette open={palette} onOpenChange={setPalette} />
      <GlobalSearch open={search} onOpenChange={setSearch} />
      <MobileFab />
    </div>
  );
}
