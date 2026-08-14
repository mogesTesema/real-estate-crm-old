import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  CircleDollarSign,
  ClipboardList,
  MapPin,
  Target,
  Users,
} from "lucide-react";

import { ModuleDashboard, Panel } from "../../components/ModuleDashboard";
import { Can } from "../../components/RequireRole";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useAuth } from "../../lib/auth";
import { useDemoMutate, useScopedDemoList, type DemoFieldSession } from "../../lib/demo";
import { compactMoney, relativeTime } from "../../lib/format";
import { useList } from "../../lib/hooks";
import { FollowUpsDue, GoalProgressCard, useSalesData } from "../dashboard/widgets";

const FIELD_KINDS = [
  { id: "viewing", label: "Viewing" },
  { id: "sale", label: "Sale visit" },
  { id: "other", label: "Other field work" },
] as const;

function sessionTone(status: string) {
  if (status === "active" || status === "compliant") return "success" as const;
  return "destructive" as const;
}

export function AgentGoalsPage() {
  const { me } = useAuth();
  const d = useSalesData(me?.id ?? "", "mine");
  const commissions = useScopedDemoList("commissions", { page_size: 50 });
  const rows = commissions.data?.results ?? [];
  const net = rows.reduce((s, r) => s + Number((r as unknown as { net: number }).net || 0), 0);
  const won = d.oppRows.filter((o) => o.status === "won").length;

  return (
    <ModuleDashboard
      title="My Goals"
      description="Personal won-deal target, conversion, and commission projection."
      stats={[
        { label: "Won deals", value: won, icon: Target, tone: "success", loading: d.opps.isLoading },
        { label: "Conversion", value: `${d.conversion}%`, icon: Users, tone: "info", loading: d.leads.isLoading },
        { label: "Closed GCI", value: compactMoney(d.gci), icon: CircleDollarSign, tone: "primary", loading: d.opps.isLoading },
        { label: "Commission YTD", value: compactMoney(net), icon: CircleDollarSign, tone: "warning" },
      ]}
    >
      <GoalProgressCard won={won} />
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Goals are personal. Team leaderboards belong to your Owner and Manager, not this workspace.
        </CardContent>
      </Card>
    </ModuleDashboard>
  );
}

export function AgentTasksPage() {
  const { me } = useAuth();
  const meId = me?.id ?? "";
  const tasks = useList<{ id: string; body: string; due_at: string | null; activity_type: string }>(
    "activities",
    { activity_type: "task", actor: meId, page_size: 100 },
  );
  const today = new Date().toISOString().slice(0, 10);
  const rows = tasks.data?.results ?? [];
  const todayRows = rows.filter((t) => t.due_at && t.due_at.slice(0, 10) === today);

  return (
    <ModuleDashboard
      title="Today's Tasks"
      description="Follow-ups and tasks due today. Open the calendar for viewings and meetings."
      stats={[
        { label: "Due today", value: todayRows.length, icon: ClipboardList, tone: todayRows.length ? "warning" : "muted", loading: tasks.isLoading },
        { label: "Open tasks", value: rows.length, icon: Target, tone: "info", loading: tasks.isLoading },
      ]}
      actions={
        <Button variant="outline" asChild>
          <Link to="/calendar?type=task">Calendar tasks</Link>
        </Button>
      }
    >
      <Panel title="Due today" loading={tasks.isLoading}>
        {todayRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing due today.</p>
        ) : (
          <ul className="divide-y divide-border">
            {todayRows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="truncate font-medium">{row.body || "Task"}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {row.due_at ? relativeTime(row.due_at) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <FollowUpsDue agentId={meId} />
    </ModuleDashboard>
  );
}

export function AgentGpsCapturePage() {
  const { me } = useAuth();
  const list = useScopedDemoList<DemoFieldSession>("fieldSessions", { page_size: 50 });
  const mutate = useDemoMutate("fieldSessions");
  const [gpsOn, setGpsOn] = useState(false);
  const rows = list.data?.results ?? [];
  const active = rows.find((r) => r.status === "active");

  function start(kind: (typeof FIELD_KINDS)[number]) {
    if (!gpsOn) {
      toast.error("Turn GPS on before starting field activity.");
      return;
    }
    if (active) {
      toast.error("End the current session first.");
      return;
    }
    mutate.upsert({
      id: `gps-${Date.now()}`,
      agent: me?.full_name || me?.email || "Agent",
      activity: `${kind.label} — in progress`,
      started_at: new Date().toISOString(),
      ended_at: "",
      points: 0,
      status: "active",
      ownerEmail: me?.email ?? "",
    });
    toast.success("Field session started (demo).");
  }

  return (
    <ModuleDashboard
      title="Location tracking"
      description="GPS must be on when you leave for a sale, viewing, or other field work. Capture only — managers review tracks separately."
      stats={[
        { label: "GPS", value: gpsOn ? "On" : "Off", icon: MapPin, tone: gpsOn ? "success" : "destructive" },
        { label: "Active session", value: active ? 1 : 0, icon: Target, tone: active ? "warning" : "muted" },
        { label: "My sessions", value: rows.length, icon: Calendar, tone: "info", loading: list.isLoading },
        { label: "Check-ins", value: rows.reduce((n, r) => n + r.points, 0), icon: ClipboardList, tone: "primary" },
      ]}
      actions={
        <Button
          variant={gpsOn ? "outline" : "default"}
          className="min-h-[44px]"
          onClick={() => setGpsOn((v) => !v)}
        >
          {gpsOn ? "Turn GPS off" : "Turn GPS on"}
        </Button>
      }
    >
      <Panel title="Start field activity">
        <p className="mb-3 text-sm text-muted-foreground">
          Field activity cannot start without an active tracking session.
        </p>
        <div className="flex flex-wrap gap-2">
          {FIELD_KINDS.map((k) => (
            <Can key={k.id} roles={["agent"]}>
              <Button
                variant="outline"
                className="min-h-[44px]"
                disabled={!gpsOn || Boolean(active)}
                onClick={() => start(k)}
              >
                Start {k.label.toLowerCase()}
              </Button>
            </Can>
          ))}
        </div>
      </Panel>
      {active && (
        <Panel title="Active session">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{active.activity}</p>
              <p className="text-xs text-muted-foreground">
                Started {relativeTime(active.started_at)} · {active.points} check-ins
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="min-h-[44px]"
                onClick={() => {
                  mutate.patch(active.id, { points: active.points + 1 });
                  toast.success("Viewing check-in logged (demo).");
                }}
              >
                Check in
              </Button>
              <Button
                size="sm"
                className="min-h-[44px]"
                onClick={() => {
                  mutate.patch(active.id, {
                    status: "compliant",
                    ended_at: new Date().toISOString(),
                  });
                  toast.success("Session ended (demo).");
                }}
              >
                End session
              </Button>
            </div>
          </div>
        </Panel>
      )}
      <Panel title="My sessions" loading={list.isLoading}>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{row.activity}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {relativeTime(row.started_at)} · {row.points} points
                </p>
              </div>
              <StatusBadge value={row.status} tone={sessionTone(row.status)} />
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function AgentPortalInvitePage() {
  const { me } = useAuth();
  const d = useSalesData(me?.id ?? "", "mine");
  const closed = d.oppRows.filter((o) => o.status === "won");

  return (
    <ModuleDashboard
      title="Invite to portal"
      description="Portal access is only for clients with a completed contract — not open leads."
      stats={[
        { label: "Eligible deals", value: closed.length, icon: Target, tone: "success", loading: d.opps.isLoading },
        { label: "Open deals", value: d.openDeals.length, icon: AlertTriangle, tone: "muted", loading: d.opps.isLoading },
      ]}
    >
      <Panel title="Closed contracts" loading={d.opps.isLoading}>
        {closed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No won deals yet. Invite after the sale or lease is completed.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {closed.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">Won deal {row.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">Won · {compactMoney(Number(row.value || 0))}</p>
                </div>
                <Can roles={["agent"]}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[44px]"
                    onClick={() => toast.success("Portal invite queued (demo). Open leads cannot be invited.")}
                  >
                    Invite
                  </Button>
                </Can>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}
