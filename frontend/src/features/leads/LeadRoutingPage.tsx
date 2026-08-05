import { GitBranch, Info, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useList } from "../../lib/hooks";

type Strategy = "round_robin" | "first_available";

interface Lead {
  id: string;
  status: string;
  assigned_agent: string | null;
}

interface Agent {
  id: string;
  full_name: string;
  email: string;
}

export function LeadRoutingPage() {
  const { me, refreshMe } = useAuth();
  const leads = useList<Lead>("leads", { page_size: 500 });
  const agents = useList<Agent>("users", { page_size: 200, role: "agent" });
  const [strategy, setStrategy] = useState<Strategy>(
    (me?.lead_routing_strategy as Strategy) || "round_robin",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (me?.lead_routing_strategy === "first_available" || me?.lead_routing_strategy === "round_robin") {
      setStrategy(me.lead_routing_strategy);
    }
  }, [me?.lead_routing_strategy]);

  const agentName = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of agents.data?.results ?? []) {
      map.set(a.id, a.full_name || a.email);
    }
    return map;
  }, [agents.data]);

  const workload = useMemo(() => {
    const openStatuses = new Set(["new", "contacted", "qualified"]);
    const map = new Map<string, number>();
    for (const l of leads.data?.results ?? []) {
      if (!l.assigned_agent || !openStatuses.has(l.status)) continue;
      map.set(l.assigned_agent, (map.get(l.assigned_agent) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => a.count - b.count);
  }, [leads.data]);

  const unassigned = (leads.data?.results ?? []).filter(
    (l) => !l.assigned_agent && ["new", "contacted", "qualified"].includes(l.status),
  ).length;

  async function save(next: Strategy) {
    setBusy(true);
    try {
      await api.patch("/me/", { lead_routing_strategy: next });
      await refreshMe();
      setStrategy(next);
      toast.success(
        next === "round_robin"
          ? "Round-robin saved — fewest active leads first"
          : "First-available saved — free agents preferred",
      );
    } catch (err) {
      toast.error(apiError(err, "Could not save routing strategy"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Lead routing"
        description="How new leads are assigned to agents. Strategy is stored on the tenant."
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Agents with open leads"
          value={workload.length}
          icon={Users}
          tone="info"
          loading={leads.isLoading}
        />
        <StatCard
          label="Unassigned open"
          value={unassigned}
          icon={GitBranch}
          tone={unassigned > 0 ? "warning" : "muted"}
          loading={leads.isLoading}
        />
        <StatCard
          label="Active strategy"
          value={strategy === "round_robin" ? "Round-robin" : "First available"}
          icon={Info}
          tone="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assignment strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                {
                  id: "round_robin" as Strategy,
                  title: "Round-robin (default)",
                  hint: "Assign to the agent with the fewest open leads.",
                },
                {
                  id: "first_available" as Strategy,
                  title: "First available",
                  hint: "Prefer an agent with zero open leads, else fewest.",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={busy}
                onClick={() => void save(opt.id)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  strategy === opt.id
                    ? "border-primary bg-primary-subtle"
                    : "border-border hover:bg-muted"
                }`}
              >
                <p className="text-sm font-semibold">{opt.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{opt.hint}</p>
              </button>
            ))}
            <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              New captures use this tenant strategy via the lead engine.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent workload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workload.length === 0 && !leads.isLoading && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No assigned open leads yet. Capture a lead to see routing in action.
              </p>
            )}
            {workload.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>{agentName.get(w.id) ?? `…${w.id.slice(-8)}`}</span>
                <span className="font-semibold tabular">{w.count} open</span>
              </div>
            ))}
            {workload.length > 0 && (
              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() =>
                  toast.message(
                    `Next assignment → ${agentName.get(workload[0].id) ?? "lightest agent"}`,
                  )
                }
              >
                Preview next assignee
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
