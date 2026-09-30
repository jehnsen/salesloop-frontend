"use client";

import * as React from "react";
import { CalendarCheck } from "lucide-react";
import type { FollowUp } from "@/types";
import { followUpView, getFollowUps, type FollowUpView } from "@/services/followups";
import { useAsync, useDbChange } from "@/lib/hooks/use-async";
import { useProductLookup } from "@/lib/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { FollowUpCard } from "@/components/admin/follow-up-card";
import { AdminPageHeader, PanelSkeleton } from "@/components/admin/primitives";

const VIEWS: { id: FollowUpView; label: string; empty: string }[] = [
  { id: "today", label: "Today", empty: "Nothing scheduled for today." },
  { id: "overdue", label: "Overdue", empty: "No overdue follow-ups. Nice work!" },
  { id: "upcoming", label: "Upcoming", empty: "No upcoming follow-ups." },
  { id: "completed", label: "Completed", empty: "Completed follow-ups will appear here." },
];

export default function FollowUpsPage() {
  const data = useAsync(getFollowUps);
  const { name } = useProductLookup();
  const [tab, setTab] = React.useState<FollowUpView>("today");
  useDbChange(() => void data.reload({ silent: true }));

  const grouped = React.useMemo(() => {
    const map: Record<FollowUpView, FollowUp[]> = { today: [], overdue: [], upcoming: [], completed: [] };
    for (const f of data.data ?? []) map[followUpView(f)].push(f);
    map.completed.sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
    return map;
  }, [data.data]);

  const replace = (updated: FollowUp) => data.setData((list) => list?.map((f) => (f.id === updated.id ? updated : f)));

  return (
    <>
      <AdminPageHeader title="Follow-ups" description="Reminders created by the AI and by you, with suggested messages ready to send." />
      {data.error ? (
        <ErrorState action={<Button onClick={() => data.reload()}>Retry</Button>} />
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as FollowUpView)}>
          <TabsList className="mb-5">
            {VIEWS.map((v) => (
              <TabsTrigger key={v.id} value={v.id}>
                {v.label}
                <span className={v.id === "overdue" && grouped.overdue.length ? "rounded-full bg-destructive px-1.5 text-[11px] text-white" : "text-xs text-muted-foreground"}>
                  {grouped[v.id].length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {VIEWS.map((v) => (
            <TabsContent key={v.id} value={v.id}>
              {data.loading ? (
                <div className="grid gap-4 lg:grid-cols-2"><PanelSkeleton /><PanelSkeleton /></div>
              ) : grouped[v.id].length === 0 ? (
                <EmptyState icon={CalendarCheck} title={v.empty} />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {grouped[v.id].map((f) => (
                    <FollowUpCard key={f.id} followUp={f} productName={f.productSlug ? name(f.productSlug) : undefined} onChange={replace} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </>
  );
}
