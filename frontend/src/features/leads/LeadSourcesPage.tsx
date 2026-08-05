import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { apiError } from "../../lib/api";
import { useCreate, useDelete, useList } from "../../lib/hooks";
import { humanize } from "../../lib/status";

interface Lead {
  id: string;
  source: string;
  status: string;
}

interface LeadSource {
  id: string;
  key: string;
  label: string;
  is_active: boolean;
  weight: number;
}

export function LeadSourcesPage() {
  const leads = useList<Lead>("leads", { page_size: 500 });
  const sources = useList<LeadSource>("lead-sources", { page_size: 200 });
  const create = useCreate<LeadSource>("lead-sources");
  const remove = useDelete("lead-sources");
  const [label, setLabel] = useState("");
  const [weight, setWeight] = useState("10");

  const rows = useMemo(() => {
    const catalog = sources.data?.results ?? [];
    const counts = new Map<string, { total: number; converted: number }>();
    for (const s of catalog) {
      counts.set(s.key, { total: 0, converted: 0 });
    }
    for (const l of leads.data?.results ?? []) {
      const key = l.source || "unknown";
      const cur = counts.get(key) ?? { total: 0, converted: 0 };
      cur.total += 1;
      if (l.status === "converted") cur.converted += 1;
      counts.set(key, cur);
    }
    const byKey = new Map(catalog.map((s) => [s.key, s]));
    return [...counts.entries()]
      .map(([key, c]) => {
        const src = byKey.get(key);
        return {
          id: src?.id,
          key,
          label: src?.label ?? humanize(key),
          weight: src?.weight ?? 10,
          total: c.total,
          converted: c.converted,
          rate: c.total ? Math.round((c.converted / c.total) * 100) : 0,
          managed: Boolean(src),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [leads.data, sources.data]);

  async function add() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase().replace(/\s+/g, "_");
    try {
      await create.mutateAsync({
        key,
        label: trimmed,
        is_active: true,
        weight: Number(weight) || 10,
      } as Partial<LeadSource>);
      setLabel("");
      toast.success(`Source "${trimmed}" added`);
    } catch (err) {
      toast.error(apiError(err, "Could not create source"));
    }
  }

  async function onRemove(id: string) {
    try {
      await remove.mutateAsync(id);
      toast.success("Source removed");
    } catch (err) {
      toast.error(apiError(err, "Could not remove source"));
    }
  }

  return (
    <div>
      <PageHeader
        title="Lead sources"
        description="Server-backed source catalog with live volume and conversion."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">Source</th>
                    <th className="px-3 py-2 font-medium">Weight</th>
                    <th className="px-3 py-2 font-medium">Leads</th>
                    <th className="px-3 py-2 font-medium">Converted</th>
                    <th className="px-3 py-2 font-medium">Conv. rate</th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium">{r.label}</td>
                      <td className="px-3 py-2 tabular">{r.weight}</td>
                      <td className="px-3 py-2 tabular">{r.total}</td>
                      <td className="px-3 py-2 tabular">{r.converted}</td>
                      <td className="px-3 py-2 tabular">{r.rate}%</td>
                      <td className="px-3 py-2 text-right">
                        {r.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            aria-label={`Remove ${r.label}`}
                            onClick={() => void onRemove(r.id!)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Label (e.g. Instagram)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Score weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Button className="w-full" onClick={() => void add()} disabled={create.isPending}>
              {create.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add source
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
