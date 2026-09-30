"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Info, Sparkles } from "lucide-react";
import type { AnalyticsRange, TimeSeriesPoint } from "@/types";
import { getAnalytics } from "@/services/analytics";
import { useAsync } from "@/lib/hooks/use-async";
import { formatDate, formatNumber, formatPeso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { ErrorState } from "@/components/shared/states";
import { BarList, ChartCard, ColumnChart, TrendChart } from "@/components/admin/charts";
import { AdminPageHeader, PanelSkeleton, StatCard, StatGridSkeleton } from "@/components/admin/primitives";

const RANGE_LABEL: Record<AnalyticsRange, string> = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" };

function seriesTable(data: TimeSeriesPoint[], keys: { key: string; label: string; format?: (v: number) => string }[]) {
  return {
    columns: ["Date", ...keys.map((k) => k.label)],
    rows: data.map((d) => [formatDate(d.date), ...keys.map((k) => (k.format ?? formatNumber)(Number(d[k.key])))]),
  };
}

export default function AnalyticsPage() {
  const [range, setRange] = React.useState<AnalyticsRange>("30d");
  const report = useAsync(() => getAnalytics(range), [range]);
  const r = report.data;
  const bucketNote = range === "90d" ? "Weekly totals" : "Daily totals";

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description="How visitors turn into conversations, leads, and orders, and how much the AI contributes."
        actions={
          <Tabs value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
            <TabsList aria-label="Date range">
              {(Object.keys(RANGE_LABEL) as AnalyticsRange[]).map((k) => (
                <TabsTrigger key={k} value={k}>{RANGE_LABEL[k]}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {report.error ? (
        <ErrorState action={<Button onClick={() => report.reload()}>Retry</Button>} />
      ) : report.loading || !r ? (
        <div className="space-y-6">
          <PanelSkeleton rows={2} />
          <StatGridSkeleton />
          <div className="grid gap-6 xl:grid-cols-2"><PanelSkeleton rows={6} /><PanelSkeleton rows={6} /></div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/25">
            <div className="grid gap-6 bg-gradient-to-br from-primary-soft/70 via-card to-card p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-medium text-accent-foreground">
                  <Sparkles className="size-4" aria-hidden /> AI-Attributed Revenue
                  <Tooltip
                    content="Revenue from confirmed orders where the customer interacted with the AI assistant before ordering (asked questions, got a recommendation, or had their inquiry prepared by the AI). Orders only count once you confirm them."
                  >
                    <button type="button" aria-label="How AI-Attributed Revenue is calculated" className="text-muted-foreground hover:text-foreground">
                      <Info className="size-4" />
                    </button>
                  </Tooltip>
                </p>
                <p className="text-5xl font-semibold tracking-tight tabular-nums">{formatPeso(r.aiAttributedRevenue.value)}</p>
                <p className="text-sm text-muted-foreground">
                  {r.aiAttributedRevenue.share}% of confirmed sales · {RANGE_LABEL[range].toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-3 shadow-soft">
                {r.aiAttributedRevenue.change >= 0 ? (
                  <ArrowUpRight className="size-5 text-success" aria-hidden />
                ) : (
                  <ArrowDownRight className="size-5 text-destructive" aria-hidden />
                )}
                <div>
                  <p className={r.aiAttributedRevenue.change >= 0 ? "text-lg font-semibold text-success" : "text-lg font-semibold text-destructive"}>
                    {r.aiAttributedRevenue.change >= 0 ? "+" : ""}
                    {r.aiAttributedRevenue.change}%
                  </p>
                  <p className="text-xs text-muted-foreground">vs previous period</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {r.headline.map((k) => <StatCard key={k.id} kpi={{ ...k, helper: "vs previous period" }} />)}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Sales over time" description={`${bucketNote} · confirmed orders`} table={seriesTable(r.salesOverTime, [{ key: "revenue", label: "All sales", format: formatPeso }, { key: "aiRevenue", label: "AI-attributed", format: formatPeso }])}>
              <TrendChart data={r.salesOverTime} format="currency" series={[{ key: "revenue", label: "All sales" }, { key: "aiRevenue", label: "AI-attributed" }]} />
            </ChartCard>
            <ChartCard title="Leads over time" description={bucketNote} table={seriesTable(r.leadsOverTime, [{ key: "leads", label: "Leads" }, { key: "qualified", label: "Qualified" }])}>
              <TrendChart data={r.leadsOverTime} series={[{ key: "leads", label: "Leads" }, { key: "qualified", label: "Qualified leads" }]} />
            </ChartCard>
            <ChartCard title="Conversations over time" description={`${bucketNote} · website chat + Messenger`} table={seriesTable(r.conversationsOverTime, [{ key: "conversations", label: "Conversations" }])}>
              <TrendChart data={r.conversationsOverTime} series={[{ key: "conversations", label: "Conversations" }]} />
            </ChartCard>
            <ChartCard title="Conversion rate" description="Share of leads that became orders" table={seriesTable(r.conversionRate, [{ key: "rate", label: "Lead → order", format: (v) => `${v.toFixed(1)}%` }])}>
              <TrendChart data={r.conversionRate} format="percent" area={false} series={[{ key: "rate", label: "Lead → order rate" }]} />
            </ChartCard>
            <ChartCard
              title="AI-assisted conversions"
              description="Orders where the customer chatted with the AI first"
              table={seriesTable(r.aiAssistedOrders, [{ key: "ai", label: "AI-assisted" }, { key: "other", label: "Other" }])}
            >
              <ColumnChart data={r.aiAssistedOrders} stacked series={[{ key: "ai", label: "AI-assisted" }, { key: "other", label: "Other orders" }]} />
            </ChartCard>
            <ChartCard
              title="Repeat customers"
              description="Orders from returning vs new customers"
              table={seriesTable(r.repeatCustomers, [{ key: "repeat", label: "Repeat" }, { key: "new", label: "New" }])}
            >
              <ColumnChart data={r.repeatCustomers} stacked series={[{ key: "repeat", label: "Repeat customers" }, { key: "new", label: "New customers" }]} />
            </ChartCard>
            <ChartCard
              title="Lead source performance"
              description="Leads by source. Open the table for conversion rates."
              table={{ columns: ["Source", "Leads", "Orders", "Conversion"], rows: r.leadSources.map((s) => [s.name, s.value, s.secondary ?? 0, `${Math.round(((s.secondary ?? 0) / Math.max(s.value, 1)) * 100)}%`]) }}
            >
              <BarList data={r.leadSources} seriesLabel="Leads" />
            </ChartCard>
            <ChartCard title="Product interest" description="Conversations mentioning each product" table={{ columns: ["Product", "Conversations"], rows: r.productInterest.map((p) => [p.name, p.value]) }}>
              <BarList data={r.productInterest} seriesLabel="Conversations" />
            </ChartCard>
            <ChartCard title="Follow-up conversion" description="Share of follow-ups that led to an order, by reason" table={{ columns: ["Reason", "Converted"], rows: r.followUpConversion.map((f) => [f.name, `${f.value}%`]) }}>
              <BarList data={r.followUpConversion} format="percent" seriesLabel="Converted" />
            </ChartCard>
            <ChartCard title="Content performance" description="Engagements on published content" table={{ columns: ["Content", "Engagements", "Leads"], rows: r.contentPerformance.map((c) => [c.name, c.value, c.secondary ?? 0]) }}>
              <BarList data={r.contentPerformance} seriesLabel="Engagements" />
            </ChartCard>
          </div>
        </div>
      )}
    </>
  );
}
