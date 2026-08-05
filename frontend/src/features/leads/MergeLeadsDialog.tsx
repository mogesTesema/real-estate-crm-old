import { AlertTriangle, GitMerge } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { api, apiError } from "../../lib/api";
import { useList } from "../../lib/hooks";
import { type Lead } from "./LeadsPage";

/**
 * Lead duplicate review (LEAD-07). Leads share contacts via the capture engine;
 * true record merge happens on contacts. This dialog finds lead pairs that share
 * email/phone and offers to open contact merge for their linked contacts.
 */
export function MergeLeadsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data } = useList<Lead>("leads", { page_size: 200 });
  const [selected, setSelected] = useState<[Lead, Lead] | null>(null);
  const [busy, setBusy] = useState(false);

  const pairs = useMemo(() => {
    const rows = data?.results ?? [];
    const out: [Lead, Lead][] = [];
    const seen = new Set<string>();
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i];
        const b = rows[j];
        const emailMatch =
          !!a.email && !!b.email && a.email.toLowerCase() === b.email.toLowerCase();
        const phoneMatch = !!a.phone && !!b.phone && a.phone === b.phone;
        if (!emailMatch && !phoneMatch) continue;
        const key = [a.id, b.id].sort().join(":");
        if (seen.has(key)) continue;
        seen.add(key);
        out.push([a, b]);
      }
    }
    return out.slice(0, 20);
  }, [data]);

  async function mergeContacts() {
    if (!selected) return;
    const [a, b] = selected;
    if (!a.contact || !b.contact || a.contact === b.contact) {
      toast.message(
        a.contact === b.contact
          ? "These leads already share the same contact."
          : "One of these leads has no linked contact yet.",
      );
      return;
    }
    setBusy(true);
    try {
      await api.post(`/contacts/${a.contact}/merge/`, { duplicate_id: b.contact });
      toast.success("Linked contacts merged — lead activity now shares one 360 profile");
      onOpenChange(false);
      setSelected(null);
    } catch (e) {
      toast.error(apiError(e, "Contact merge failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="size-5" /> Review duplicate leads
          </DialogTitle>
        </DialogHeader>

        <p className="flex items-start gap-2 rounded-md bg-warning-subtle px-3 py-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Merging consolidates the linked contacts. Lead rows stay for audit; conversion
          and timeline attach to the survivor contact.
        </p>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {pairs.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No duplicate lead pairs found by email or phone.
            </p>
          )}
          {pairs.map(([a, b]) => {
            const active =
              selected?.[0].id === a.id && selected?.[1].id === b.id;
            return (
              <button
                key={`${a.id}-${b.id}`}
                onClick={() => setSelected([a, b])}
                className={`w-full rounded-md border p-3 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary-subtle"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="grid grid-cols-2 gap-3">
                  {[a, b].map((l) => (
                    <div key={l.id} className="flex items-center gap-2">
                      <Avatar name={l.name || l.email} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{l.name || "—"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {l.email || l.phone || "No identifiers"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={mergeContacts} disabled={!selected || busy}>
            Merge linked contacts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
