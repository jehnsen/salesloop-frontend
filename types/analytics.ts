export interface KPI {
  id: string;
  label: string;
  value: number;
  format: "number" | "currency" | "percent";
  /** Percentage change versus the previous period. */
  change: number;
  helper?: string;
}

export interface FunnelStep {
  label: string;
  value: number;
}

export interface TimeSeriesPoint {
  date: string;
  [series: string]: number | string;
}

export interface CategoryValue {
  name: string;
  value: number;
  secondary?: number;
}

export interface DashboardSummary {
  kpis: KPI[];
  funnel: FunnelStep[];
}

export type AnalyticsRange = "7d" | "30d" | "90d";

export interface AnalyticsReport {
  range: AnalyticsRange;
  headline: KPI[];
  aiAttributedRevenue: { value: number; share: number; change: number };
  leadsOverTime: TimeSeriesPoint[];
  salesOverTime: TimeSeriesPoint[];
  conversationsOverTime: TimeSeriesPoint[];
  conversionRate: TimeSeriesPoint[];
  leadSources: CategoryValue[];
  productInterest: CategoryValue[];
  repeatCustomers: TimeSeriesPoint[];
  aiAssistedOrders: TimeSeriesPoint[];
  followUpConversion: CategoryValue[];
  contentPerformance: CategoryValue[];
}
