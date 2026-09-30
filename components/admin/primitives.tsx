import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Minus } from "lucide-react";
import type { KPI } from "@/types";
import { cn, formatCompactPeso, formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminPageHeader({
  title,
  description,
  actions,
  back,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function formatKPI(kpi: Pick<KPI, "value" | "format">) {
  if (kpi.format === "currency") return formatCompactPeso(kpi.value);
  if (kpi.format === "percent") return `${kpi.value.toFixed(1)}%`;
  return formatNumber(kpi.value);
}

export function StatCard({
  kpi,
  icon: Icon,
  href,
  highlight,
}: {
  kpi: KPI;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  highlight?: boolean;
}) {
  const up = kpi.change > 0;
  const flat = kpi.change === 0;
  const body = (
    <Card className={cn("h-full p-4 transition-shadow sm:p-5", href && "hover:shadow-lift", highlight && "border-primary/30 bg-primary-soft/40")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{kpi.label}</p>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.7rem]">{formatKPI(kpi)}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
        {!flat && (
          <span className={cn("inline-flex items-center font-medium", up ? "text-success" : "text-destructive")}>
            {up ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
            {Math.abs(kpi.change)}%<span className="sr-only">{up ? " increase" : " decrease"}</span>
          </span>
        )}
        {flat && kpi.id !== "follow_ups" && <Minus className="size-3.5 text-muted-foreground" aria-hidden />}
        {kpi.helper && <span className="text-muted-foreground">{kpi.helper}</span>}
      </div>
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl focus-visible:outline-2">
      {body}
    </Link>
  ) : (
    body
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" role="status" aria-label="Loading metrics">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="space-y-3 p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-28" />
        </Card>
      ))}
    </div>
  );
}

export function PanelSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <Card className={cn("space-y-4 p-5", className)} role="status" aria-label="Loading">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </Card>
  );
}

/** Titled card section used across admin pages. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("flex-1 p-5", contentClassName)}>{children}</div>
    </Card>
  );
}
