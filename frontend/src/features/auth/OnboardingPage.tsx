import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAuth } from "../../lib/auth";

type Step = { id: string; label: string; to: string };

function stepsForRole(role: string | undefined): Step[] {
  const base: Step[] = [
    { id: "profile", label: "Confirm your profile name and role", to: "/settings?tab=profile" },
  ];
  if (role === "marketing") {
    return [
      ...base,
      { id: "sources", label: "Review lead sources", to: "/leads/sources" },
      { id: "analytics", label: "Open lead analytics", to: "/leads/analytics" },
    ];
  }
  if (role === "finance") {
    return [
      ...base,
      { id: "pipeline", label: "Review pipeline forecast", to: "/pipeline/forecast" },
      { id: "reports", label: "Open reports", to: "/reports" },
    ];
  }
  if (role === "property_manager") {
    return [
      ...base,
      { id: "leases", label: "Review active leases", to: "/leases?status=active" },
      { id: "rent", label: "Check rent collection and late payments", to: "/rent/late" },
      { id: "maintenance", label: "Open the work-order queue", to: "/maintenance" },
    ];
  }
  if (role === "owner" || role === "manager" || role === "super_admin") {
    return [
      ...base,
      { id: "routing", label: "Set lead routing strategy", to: "/leads/routing" },
      { id: "lead", label: "Capture a lead", to: "/leads?new=1" },
      { id: "pipeline", label: "Open the pipeline board", to: "/pipeline" },
      { id: "org", label: "Check organization settings", to: "/settings?tab=org" },
    ];
  }
  // agent / portal / default
  return [
    ...base,
    { id: "lead", label: "Capture your first lead", to: "/leads?new=1" },
    { id: "property", label: "Add a property listing", to: "/properties?new=1" },
    { id: "pipeline", label: "Open the pipeline board", to: "/pipeline" },
  ];
}

/** First-login checklist (ONB-01 / SRS §5.7). */
export function OnboardingPage() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const steps = useMemo(() => stepsForRole(me?.role), [me?.role]);
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("onboarding-done") ?? "{}") as Record<
        string,
        boolean
      >;
    } catch {
      return {};
    }
  });

  function toggle(id: string) {
    setDone((d) => {
      const next = { ...d, [id]: !d[id] };
      localStorage.setItem("onboarding-done", JSON.stringify(next));
      return next;
    });
  }

  const complete = steps.every((s) => done[s.id]);

  return (
    <div>
      <PageHeader
        title={`Welcome${me?.full_name ? `, ${me.full_name.split(" ")[0]}` : ""}`}
        description="A short checklist to get productive in EstateCRM."
        actions={
          <Button variant="outline" onClick={() => navigate("/")}>
            Skip for now
          </Button>
        }
      />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Getting started · {me?.role?.replace(/_/g, " ") ?? "agent"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <label className="flex flex-1 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!done[s.id]}
                  onChange={() => toggle(s.id)}
                  className="size-4 accent-[hsl(var(--primary))]"
                />
                {s.label}
              </label>
              <Button variant="ghost" size="sm" asChild>
                <Link to={s.to}>Open</Link>
              </Button>
            </div>
          ))}
          {complete && (
            <div className="flex items-center gap-2 rounded-md bg-success-subtle px-3 py-2 text-sm text-success">
              <CheckCircle2 className="size-4" /> You&apos;re set — head to the dashboard.
            </div>
          )}
          <Button className="mt-2 w-full" onClick={() => navigate("/")}>
            Go to dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
