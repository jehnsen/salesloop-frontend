"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Info, Table2 } from "lucide-react";
import type { CategoryValue, FunnelStep, TimeSeriesPoint } from "@/types";
import { cn, formatCompactNumber, formatCompactPeso, formatDate, formatNumber, formatPeso } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Tooltip as UITooltip } from "@/components/ui/tooltip";

/**
 * Chart palette mirrors the --chart-* tokens in globals.css. Validated so adjacent
 * series stay distinguishable for colour-vision deficiencies. Assign in this order.
 */
export const CHART_COLORS = ["#2f7d4f", "#3b7fb6", "#c9602f", "#8a5a9e"] as const;
const GRID = "#ece8e0";
const AXIS = "#7a7d73";

export type ValueFormat = "number" | "currency" | "percent";

function fmt(value: number, format: ValueFormat, compact = false) {
  if (format === "currency") return compact ? formatCompactPeso(value) : formatPeso(value);
  if (format === "percent") return `${value.toFixed(1)}%`;
  return compact ? formatCompactNumber(value) : formatNumber(value);
}

export interface SeriesDef {
  key: string;
  label: string;
}

// ---------------------------------------------------------------------------

export function ChartCard({
  title,
  description,
  info,
  action,
  table,
  className,
  children,
}: {
  title: string;
  description?: string;
  info?: string;
  action?: React.ReactNode;
  /** Accessible table alternative for the chart. */
  table?: { columns: string[]; rows: (string | number)[][] };
  className?: string;
  children: React.ReactNode;
}) {
  const [view, setView] = React.useState<"chart" | "table">("chart");
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-start justify-between gap-3 p-5 pb-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 font-semibold">
            {title}
            {info && (
              <UITooltip content={info}>
                <button type="button" className="text-muted-foreground hover:text-foreground" aria-label={`About ${title}`}>
                  <Info className="size-3.5" />
                </button>
              </UITooltip>
            )}
          </h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {action}
          {table && (
            <button
              type="button"
              onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={view === "chart" ? `Show ${title} as a table` : `Show ${title} as a chart`}
              title={view === "chart" ? "Table view" : "Chart view"}
            >
              {view === "chart" ? <Table2 className="size-4" /> : <BarChart3 className="size-4" />}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 px-3 pb-4 sm:px-5">
        {view === "table" && table ? (
          <div className="max-h-72 overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  {table.columns.map((c) => (
                    <th key={c} scope="col" className="px-3 py-2 text-left font-medium text-muted-foreground">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className="border-t">
                    {row.map((cell, j) => (
                      <td key={j} className={cn("px-3 py-1.5", j > 0 && "tabular-nums")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

function Legend({ series }: { series: SeriesDef[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mb-2 flex flex-wrap gap-4 px-2 text-xs text-muted-foreground">
      {series.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full" style={{ background: CHART_COLORS[i] }} aria-hidden />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  format,
  formatLabel,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: unknown; value?: unknown; name?: unknown }>;
  label?: unknown;
  series: SeriesDef[];
  format: ValueFormat;
  formatLabel?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-lg border bg-card px-3 py-2 text-xs shadow-lift">
      <p className="mb-1 font-medium">{formatLabel ? formatLabel(String(label)) : String(label)}</p>
      {payload.map((p) => {
        const idx = series.findIndex((s) => s.key === p.dataKey);
        return (
          <p key={String(p.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: CHART_COLORS[Math.max(idx, 0)] }} aria-hidden />
              {series[idx]?.label ?? p.name}
            </span>
            <span className="font-medium tabular-nums">{fmt(Number(p.value), format)}</span>
          </p>
        );
      })}
    </div>
  );
}

const shortDate = (d: string) => formatDate(d, { month: "short", day: "numeric" });

/** Line/area trend over time. One y-axis only. */
export function TrendChart({
  data,
  series,
  format = "number",
  height = 240,
  area = true,
}: {
  data: TimeSeriesPoint[];
  series: SeriesDef[];
  format?: ValueFormat;
  height?: number;
  area?: boolean;
}) {
  const id = React.useId().replace(/:/g, "");
  return (
    <div>
      <Legend series={series} />
      <div style={{ height }} role="img" aria-label={`Trend of ${series.map((s) => s.label).join(" and ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[i]} stopOpacity={area ? 0.12 : 0} />
                  <stop offset="100%" stopColor={CHART_COLORS[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fill: AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(v: number) => fmt(v, format, true)}
              tick={{ fill: AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={52}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: AXIS, strokeWidth: 1 }}
              content={(props) => <ChartTooltip {...props} series={series} format={format} formatLabel={(l) => formatDate(String(l))} />}
            />
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={CHART_COLORS[i]}
                strokeWidth={2}
                fill={`url(#${id}-${s.key})`}
                dot={false}
                activeDot={{ r: 4, stroke: "#ffffff", strokeWidth: 2, fill: CHART_COLORS[i] }}
                strokeLinecap="round"
                strokeLinejoin="round"
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Horizontal bars for ranked categories. Single series = one colour; value labelled at the tip. */
export function BarList({
  data,
  format = "number",
  height,
  seriesLabel = "Value",
}: {
  data: CategoryValue[];
  format?: ValueFormat;
  height?: number;
  seriesLabel?: string;
}) {
  const h = height ?? Math.max(160, data.length * 36);
  return (
    <div style={{ height: h }} role="img" aria-label={`${seriesLabel} by category`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={132}
            tick={{ fill: "#3d4238", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "#f4f1ea" }}
            content={(props) => <ChartTooltip {...props} series={[{ key: "value", label: seriesLabel }]} format={format} />}
          />
          <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v: unknown) => fmt(Number(v), format, true)}
              style={{ fill: "#3d4238", fontSize: 11, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Vertical grouped columns (e.g. new vs repeat) over time. */
export function ColumnChart({
  data,
  series,
  format = "number",
  height = 240,
  stacked = false,
}: {
  data: TimeSeriesPoint[];
  series: SeriesDef[];
  format?: ValueFormat;
  height?: number;
  stacked?: boolean;
}) {
  return (
    <div>
      <Legend series={series} />
      <div style={{ height }} role="img" aria-label={`${series.map((s) => s.label).join(" and ")} over time`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
            <YAxis tickFormatter={(v: number) => fmt(v, format, true)} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "#f4f1ea" }}
              content={(props) => <ChartTooltip {...props} series={series} format={format} formatLabel={(l) => formatDate(String(l))} />}
            />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId={stacked ? "a" : undefined}
                fill={CHART_COLORS[i]}
                stroke="#ffffff"
                strokeWidth={stacked ? 1 : 0}
                radius={stacked ? (i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]) : [4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Funnel as proportional HTML bars with step-to-step conversion. Single hue: the stages are ordered. */
export function FunnelBars({ steps, className }: { steps: FunnelStep[]; className?: string }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <ol className={cn("grid gap-2.5", className)}>
      {steps.map((step, i) => {
        const prev = steps[i - 1];
        const rate = prev ? (step.value / Math.max(prev.value, 1)) * 100 : null;
        const width = Math.max((step.value / max) * 100, 3);
        return (
          <li key={step.label} className="grid grid-cols-[minmax(0,7.5rem)_1fr] items-center gap-3 sm:grid-cols-[9rem_1fr]">
            <span className="truncate text-sm text-muted-foreground">{step.label}</span>
            <div className="flex items-center gap-3">
              <div className="h-7 flex-1">
                <div
                  className="flex h-full items-center rounded-r-[4px] bg-chart-1 transition-[width]"
                  style={{ width: `${width}%` }}
                  title={`${step.label}: ${formatNumber(step.value)}`}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-sm">
                <span className="font-semibold tabular-nums">{formatNumber(step.value)}</span>
                {rate !== null && <span className="block text-[11px] text-muted-foreground">{rate.toFixed(0)}% of prev.</span>}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
