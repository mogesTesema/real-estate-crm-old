import { Calendar as CalIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useScopedDemoList, type DemoCalendarEvent } from "../../lib/demo";
import { relativeTime } from "../../lib/format";
import { humanize, toneForStatus } from "../../lib/status";

export function CalendarPage() {
  const [params] = useSearchParams();
  const type = params.get("type") ?? undefined;
  const list = useScopedDemoList<DemoCalendarEvent>("calendar", { type, page_size: 100 });
  const [selected, setSelected] = useState<string | null>(null);

  const rows = list.data?.results ?? [];
  const byDay = useMemo(() => {
    const map = new Map<string, DemoCalendarEvent[]>();
    for (const e of rows) {
      const day = e.start.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="My Calendar"
        description="Viewings, tasks, meetings, and inspections."
        actions={
          <Button size="sm" onClick={() => setSelected("new")}>
            Add event
          </Button>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={CalIcon}
          title="No events"
          description="Schedule a viewing or task to populate your calendar."
          entity="deal"
        />
      ) : (
        <div className="space-y-4">
          {byDay.map(([day, events]) => (
            <div key={day}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {day}
              </h2>
              <div className="space-y-2">
                {events.map((e) => (
                  <Card
                    key={e.id}
                    className={selected === e.id ? "ring-2 ring-primary" : ""}
                    onClick={() => setSelected(e.id)}
                  >
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-medium">{e.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {e.contact} · {e.property !== "—" ? e.property : "No property"} ·{" "}
                          {relativeTime(e.start)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge value={humanize(e.type)} tone="primary" />
                        <StatusBadge
                          value={humanize(e.status)}
                          tone={toneForStatus(e.status, "opportunity")}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {selected === "new" && (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Demo mode — create forms wire to the live activities API in a later phase. Existing seeded
          events above are interactive for walkthroughs.
        </p>
      )}
    </div>
  );
}
