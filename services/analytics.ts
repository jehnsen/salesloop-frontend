import type { AnalyticsRange, AnalyticsReport, CategoryValue, DashboardSummary, KPI, TimeSeriesPoint } from "@/types";
import type { MockDatabase } from "@/lib/mock-data/store";
import {
  dailyMetrics,
  followUpOutcomeWeights,
  leadSourceWeights,
  productInterestWeights,
  type DailyMetrics,
} from "@/lib/mock-data/analytics";
import { MOCK_NOW } from "@/lib/mock-data/time";
import { dayOffset } from "@/lib/utils";
import { query } from "./_mock";

const RANGE_DAYS: Record<AnalyticsRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

type Totals = Omit<DailyMetrics, "date">;

function sum(rows: DailyMetrics[]): Totals {
  return rows.reduce<Totals>(
    (acc, r) => {
      (Object.keys(acc) as (keyof Totals)[]).forEach((k) => (acc[k] += r[k]));
      return acc;
    },
    { visitors: 0, conversations: 0, leads: 0, qualified: 0, inquiries: 0, orders: 0, revenue: 0, aiRevenue: 0, aiOrders: 0, repeatOrders: 0 },
  );
}

function periods(days: number) {
  const current = dailyMetrics.slice(-days);
  const previous = dailyMetrics.slice(-days * 2, -days);
  return { current, previous, cur: sum(current), prev: sum(previous) };
}

function change(cur: number, prev: number) {
  if (!prev) return 0;
  return Number((((cur - prev) / prev) * 100).toFixed(1));
}

/** Records created in the browser after the seed (e.g. leads captured in the demo chat). */
function liveCounts(db: MockDatabase) {
  const isLive = (iso: string) => new Date(iso).getTime() > MOCK_NOW + 3_600_000;
  return {
    leads: db.leads.filter((l) => isLive(l.createdAt)).length,
    orders: db.orders.filter((o) => isLive(o.createdAt)).length,
    conversations: db.conversations.filter((c) => c.id.startsWith("web_")).length,
  };
}

export function getDashboardSummary() {
  return query<DashboardSummary>((db) => {
    const { cur, prev } = periods(30);
    const live = liveCounts(db);
    const openHighIntent = db.leads.filter((l) => l.purchaseIntent === "high" && !["converted", "lost"].includes(l.stage)).length;
    const due = db.followUps.filter((f) => f.status === "scheduled" && dayOffset(f.scheduledAt) <= 0).length;

    const kpis: KPI[] = [
      { id: "new_leads", label: "New Leads", value: cur.leads + live.leads, format: "number", change: change(cur.leads, prev.leads), helper: "Last 30 days" },
      { id: "high_intent", label: "High-Intent Leads", value: openHighIntent, format: "number", change: 12.5, helper: "Open right now" },
      { id: "inquiries", label: "Customer Inquiries", value: cur.conversations + live.conversations, format: "number", change: change(cur.conversations, prev.conversations), helper: "Conversations, 30 days" },
      { id: "follow_ups", label: "Follow-Ups Due", value: due, format: "number", change: 0, helper: "Today and overdue" },
      { id: "orders", label: "Orders", value: cur.orders + live.orders, format: "number", change: change(cur.orders, prev.orders), helper: "Last 30 days" },
      { id: "repeat", label: "Repeat Customers", value: cur.repeatOrders, format: "number", change: change(cur.repeatOrders, prev.repeatOrders), helper: "Repeat orders, 30 days" },
      { id: "sales", label: "Estimated Sales", value: cur.revenue, format: "currency", change: change(cur.revenue, prev.revenue), helper: "Confirmed orders, 30 days" },
      { id: "ai_sales", label: "AI-Assisted Sales", value: cur.aiRevenue, format: "currency", change: change(cur.aiRevenue, prev.aiRevenue), helper: `${Math.round((cur.aiRevenue / Math.max(cur.revenue, 1)) * 100)}% of sales` },
    ];

    const funnel = [
      { label: "Visitors", value: cur.visitors },
      { label: "Conversations", value: cur.conversations + live.conversations },
      { label: "Leads", value: cur.leads + live.leads },
      { label: "Qualified Leads", value: cur.qualified },
      { label: "Order Inquiries", value: cur.inquiries + live.orders },
      { label: "Confirmed Orders", value: cur.orders },
    ];
    return { kpis, funnel };
  });
}

function bucket(rows: DailyMetrics[], range: AnalyticsRange) {
  // 90 days is shown weekly; shorter ranges daily.
  if (range !== "90d") return rows.map((r) => ({ label: r.date, rows: [r] }));
  const out: { label: string; rows: DailyMetrics[] }[] = [];
  for (let i = 0; i < rows.length; i += 7) out.push({ label: rows[i].date, rows: rows.slice(i, i + 7) });
  return out;
}

function series(buckets: { label: string; rows: DailyMetrics[] }[], pick: (t: Totals) => Record<string, number>): TimeSeriesPoint[] {
  return buckets.map((b) => ({ date: b.label, ...pick(sum(b.rows)) }));
}

export function getAnalytics(range: AnalyticsRange = "30d") {
  return query<AnalyticsReport>((db) => {
    const days = RANGE_DAYS[range];
    const { current, cur, prev } = periods(days);
    const buckets = bucket(current, range);
    const pct = (a: number, b: number) => Number(((a / Math.max(b, 1)) * 100).toFixed(1));

    const leadSources: CategoryValue[] = leadSourceWeights.map((s) => {
      const leads = Math.round(cur.leads * s.weight);
      return { name: s.source, value: leads, secondary: Math.round(leads * s.conversion) };
    });
    const productInterest: CategoryValue[] = productInterestWeights.map((p) => ({
      name: p.name,
      value: Math.round(cur.conversations * p.value),
    }));
    const followUpConversion: CategoryValue[] = followUpOutcomeWeights.map((f) => ({
      name: f.name,
      value: Math.round(f.value * 100),
    }));
    const contentPerformance: CategoryValue[] = db.contentItems
      .filter((c) => c.metrics)
      .map((c) => ({ name: `${c.title.slice(0, 28)}${c.title.length > 28 ? "…" : ""}`, value: c.metrics!.engagements, secondary: c.metrics!.leads }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      range,
      headline: [
        { id: "leads", label: "Leads", value: cur.leads, format: "number", change: change(cur.leads, prev.leads) },
        { id: "orders", label: "Orders", value: cur.orders, format: "number", change: change(cur.orders, prev.orders) },
        { id: "revenue", label: "Sales", value: cur.revenue, format: "currency", change: change(cur.revenue, prev.revenue) },
        { id: "conversion", label: "Lead → Order", value: pct(cur.orders, cur.leads), format: "percent", change: Number((pct(cur.orders, cur.leads) - pct(prev.orders, prev.leads)).toFixed(1)) },
      ],
      aiAttributedRevenue: {
        value: cur.aiRevenue,
        share: pct(cur.aiRevenue, cur.revenue),
        change: change(cur.aiRevenue, prev.aiRevenue),
      },
      leadsOverTime: series(buckets, (t) => ({ leads: t.leads, qualified: t.qualified })),
      salesOverTime: series(buckets, (t) => ({ revenue: t.revenue, aiRevenue: t.aiRevenue })),
      conversationsOverTime: series(buckets, (t) => ({ conversations: t.conversations })),
      conversionRate: series(buckets, (t) => ({ rate: pct(t.orders, t.leads) })),
      leadSources,
      productInterest,
      repeatCustomers: series(buckets, (t) => ({ repeat: t.repeatOrders, new: Math.max(t.orders - t.repeatOrders, 0) })),
      followUpConversion,
      contentPerformance,
    };
  });
}
