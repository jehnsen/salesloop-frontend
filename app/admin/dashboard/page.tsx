"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  Flame,
  MessagesSquare,
  Repeat,
  ShoppingBag,
  Sparkles,
  UserPlus,
  Wallet,
} from "lucide-react";
import { getDashboardSummary } from "@/services/analytics";
import { getAIActivity } from "@/services/ai-agent";
import { getRecentConversations } from "@/services/conversations";
import { getDueFollowUps } from "@/services/followups";
import { getHighPriorityLeads } from "@/services/leads";
import { useAsync, useDbChange } from "@/lib/hooks/use-async";
import { useProductLookup } from "@/lib/hooks/use-products";
import { siteConfig } from "@/lib/mock-data/site";
import { CONVERSATION_CHANNEL_LABEL, LEAD_SOURCE_LABEL } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { DataTable } from "@/components/shared/data-table";
import { ConversationStatusBadge, IntentBadge, LeadScoreBadge } from "@/components/shared/status-badges";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { ChartCard, FunnelBars } from "@/components/admin/charts";
import { FollowUpRow } from "@/components/admin/follow-up-card";
import { AdminPageHeader, Panel, PanelSkeleton, StatCard, StatGridSkeleton } from "@/components/admin/primitives";
import { ReorderWidget } from "@/components/admin/reorder-widget";

const KPI_META: Record<string, { icon: React.ComponentType<{ className?: string }>; href?: string }> = {
  new_leads: { icon: UserPlus, href: "/admin/leads" },
  high_intent: { icon: Flame, href: "/admin/leads?intent=high" },
  inquiries: { icon: MessagesSquare, href: "/admin/conversations" },
  follow_ups: { icon: CalendarClock, href: "/admin/follow-ups" },
  orders: { icon: ShoppingBag, href: "/admin/orders" },
  repeat: { icon: Repeat, href: "/admin/customers" },
  sales: { icon: Wallet, href: "/admin/analytics" },
  ai_sales: { icon: Sparkles, href: "/admin/analytics" },
};

function greeting(now: Date) {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Manila" }).format(now));
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  // Time-based text is computed after mount so the prerendered HTML never disagrees with the client.
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => setNow(new Date()), []);
  const summary = useAsync(getDashboardSummary);
  const leads = useAsync(() => getHighPriorityLeads(5));
  const followUps = useAsync(() => getDueFollowUps(5));
  const activity = useAsync(() => getAIActivity({ limit: 7 }));
  const conversations = useAsync(() => getRecentConversations(4));
  const { name } = useProductLookup();

  useDbChange(() => {
    for (const s of [summary, leads, followUps, activity, conversations]) void s.reload({ silent: true });
  });

  return (
    <>
      <AdminPageHeader
        title={`${now ? greeting(now) : "Welcome back"}, ${siteConfig.seller.name.split(" ")[0]}`}
        description={`${now ? `${formatDate(now.toISOString(), { weekday: "long", month: "long", day: "numeric" })} · ` : ""}Here's what your AI assistant has been up to.`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/follow-ups">
                <CalendarClock aria-hidden /> Follow-ups
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/conversations">
                <MessagesSquare aria-hidden /> Open inbox
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label="Key metrics" className="mb-6">
        {summary.loading ? (
          <StatGridSkeleton count={8} />
        ) : summary.error ? (
          <ErrorState action={<Button variant="outline" onClick={() => summary.reload()}>Retry</Button>} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {summary.data?.kpis.map((k) => (
              <StatCard key={k.id} kpi={k} icon={KPI_META[k.id]?.icon} href={KPI_META[k.id]?.href} highlight={k.id === "ai_sales"} />
            ))}
          </div>
        )}
      </section>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {summary.loading ? (
          <PanelSkeleton rows={6} />
        ) : (
          <ChartCard
            title="Sales funnel"
            description="Last 30 days, from first visit to confirmed order"
            info="Visitors come from website analytics. Conversations include the website chat and Messenger. Leads are people who shared contact details."
            table={{ columns: ["Stage", "Count"], rows: summary.data?.funnel.map((s) => [s.label, s.value]) ?? [] }}
          >
            <FunnelBars steps={summary.data?.funnel ?? []} className="pt-2" />
          </ChartCard>
        )}
        {activity.loading ? (
          <PanelSkeleton rows={6} />
        ) : (
          <Panel
            title={
              <span className="flex items-center gap-2">
                <Bot className="size-4 text-leaf" aria-hidden /> AI activity
              </span>
            }
            action={
              <Button variant="link" size="sm" asChild>
                <Link href="/admin/ai-agent">View log</Link>
              </Button>
            }
          >
            {activity.data?.length ? <ActivityFeed items={activity.data} compact /> : <EmptyState compact title="No AI activity yet" />}
          </Panel>
        )}
      </div>

      <section className="mb-6" aria-labelledby="priority-leads">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="priority-leads" className="font-semibold">High priority leads</h2>
          <Button variant="link" size="sm" asChild>
            <Link href="/admin/leads">All leads <ArrowRight aria-hidden /></Link>
          </Button>
        </div>
        <DataTable
          loading={leads.loading}
          rows={leads.data ?? []}
          rowKey={(l) => l.id}
          caption="High priority leads"
          empty={{ title: "No high-intent leads right now", description: "The AI will flag customers ready to buy here." }}
          onRowClick={(l) => router.push(`/admin/leads/${l.id}`)}
          columns={[
            {
              key: "customer",
              header: "Customer",
              cell: (l) => (
                <Link href={`/admin/leads/${l.id}`} className="flex items-center gap-2.5 font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                  <Avatar name={l.name} className="size-8" /> {l.name}
                </Link>
              ),
            },
            { key: "product", header: "Product", cell: (l) => name(l.interests[0]?.productSlug) },
            { key: "qty", header: "Qty", cell: (l) => l.interests[0]?.quantity ?? "—", className: "tabular-nums" },
            { key: "score", header: "Score", cell: (l) => <LeadScoreBadge score={l.leadScore} /> },
            { key: "intent", header: "Intent", cell: (l) => <IntentBadge intent={l.lastIntent} /> },
            { key: "source", header: "Source", cell: (l) => <span className="whitespace-nowrap">{LEAD_SOURCE_LABEL[l.source]}</span> },
            { key: "last", header: "Last interaction", cell: (l) => <span className="whitespace-nowrap text-muted-foreground">{timeAgo(l.lastActivityAt)}</span> },
            { key: "action", header: "Recommended action", cell: (l) => <span className="line-clamp-2 min-w-48 text-muted-foreground">{l.recommendedAction}</span> },
          ]}
          mobileCard={(l) => (
            <Link href={`/admin/leads/${l.id}`} className="block rounded-xl border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <Avatar name={l.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{l.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {name(l.interests[0]?.productSlug)}
                    {l.interests[0]?.quantity ? ` × ${l.interests[0].quantity}` : ""} · {LEAD_SOURCE_LABEL[l.source]}
                  </p>
                </div>
                <LeadScoreBadge score={l.leadScore} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{l.recommendedAction}</p>
            </Link>
          )}
        />
      </section>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        {followUps.loading ? (
          <PanelSkeleton />
        ) : (
          <Panel
            title="Follow-ups due"
            description="Today, overdue, and tomorrow"
            action={
              <Button variant="link" size="sm" asChild>
                <Link href="/admin/follow-ups">View all</Link>
              </Button>
            }
          >
            {followUps.data?.length ? (
              <ul className="grid gap-4">
                {followUps.data.map((f) => (
                  <li key={f.id}>
                    <FollowUpRow followUp={f} productName={name(f.productSlug)} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon={CalendarClock} title="You're all caught up" description="No follow-ups due." />
            )}
          </Panel>
        )}
        <ReorderWidget limit={4} />
      </div>

      {conversations.loading ? (
        <PanelSkeleton />
      ) : (
        <Panel
          title="Recent conversations"
          action={
            <Button variant="link" size="sm" asChild>
              <Link href="/admin/conversations">Open inbox</Link>
            </Button>
          }
          contentClassName="p-0"
        >
          <ul className="divide-y">
            {conversations.data?.map((c) => {
              const last = c.messages.filter((m) => !m.isDraft && m.role !== "system").at(-1);
              return (
                <li key={c.id}>
                  <Link href={`/admin/conversations?c=${c.id}`} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/40">
                    <Avatar name={c.customerName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{c.customerName}</p>
                        <span className="text-xs text-muted-foreground">{CONVERSATION_CHANNEL_LABEL[c.channel]}</span>
                        {c.unread > 0 && <span className="rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-white">{c.unread} new</span>}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {last?.role === "assistant" ? "AI: " : last?.role === "seller" ? "You: " : ""}
                        {last?.message}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <ConversationStatusBadge status={c.status} />
                      <span className="text-[11px] text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </>
  );
}
