import { Building2, Contact2, KanbanSquare, Plus, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { navForRole } from "../lib/roles";
import { Dialog, DialogContent } from "./ui/dialog";

interface Action {
  id: string;
  label: string;
  hint: string;
  icon: React.ElementType;
  run: () => void;
}

/**
 * Cmd/Ctrl+K palette (frontend plan SHELL-02): jump to any page the role can
 * see, or quick-create a record (opens the module's create sheet via ?new=1).
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const actions = useMemo<Action[]>(() => {
    const visible = navForRole(me?.role).map((n) => n.to);
    const can = (prefix: string) =>
      visible.some((to) => to === prefix || to.startsWith(prefix + "/"));

    const creates: Action[] = [
      { id: "new-lead", label: "New lead", prefix: "/leads", icon: Users },
      { id: "new-contact", label: "New contact", prefix: "/contacts", icon: Contact2 },
      { id: "new-property", label: "New property", prefix: "/properties", icon: Building2 },
      { id: "new-deal", label: "New deal", prefix: "/pipeline", icon: KanbanSquare },
    ]
      .filter((c) => can(c.prefix))
      .map((c) => ({
        id: c.id,
        label: c.label,
        hint: "Create",
        icon: c.icon,
        run: () => navigate(`${c.prefix}?new=1`),
      }));

    const nav: Action[] = navForRole(me?.role).map((n) => ({
      id: `nav-${n.to}`,
      label: n.label,
      hint: "Go to",
      icon: n.icon,
      run: () => navigate(n.to),
    }));
    return [...creates, ...nav];
  }, [me?.role, navigate]);

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-md translate-y-0 p-0">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered[0]) {
                filtered[0].run();
                onOpenChange(false);
              }
            }}
            placeholder="Type a command or search pages…"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                a.run();
                onOpenChange(false);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <a.icon className="size-4 text-muted-foreground" />
              <span className="flex-1">{a.label}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {a.hint === "Create" && <Plus className="size-3" />}
                {a.hint}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
