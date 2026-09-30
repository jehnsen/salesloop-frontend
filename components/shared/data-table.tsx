"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./states";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

/**
 * Responsive table. On large screens it renders a real <table>; below `lg` it
 * renders `mobileCard` for each row (or falls back to a horizontally scrolling table).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  mobileCard,
  loading,
  empty,
  className,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  mobileCard?: (row: T) => React.ReactNode;
  loading?: boolean;
  empty?: { title: string; description?: string; action?: React.ReactNode };
  className?: string;
  caption?: string;
}) {
  if (loading) return <TableSkeleton columns={columns.length} />;
  if (!rows.length) {
    return <EmptyState title={empty?.title ?? "Nothing here yet"} description={empty?.description} action={empty?.action} />;
  }

  return (
    <div className={className}>
      {mobileCard && (
        <ul className="grid gap-3 lg:hidden">
          {rows.map((row) => (
            <li key={rowKey(row)}>{mobileCard(row)}</li>
          ))}
        </ul>
      )}
      <div className={cn("overflow-x-auto rounded-xl border bg-card shadow-soft", mobileCard && "hidden lg:block")}>
        <table className="w-full min-w-[720px] text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn("px-4 py-3 text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground uppercase", c.headerClassName)}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter") onRowClick(row);
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  "border-b align-middle transition-colors last:border-b-0",
                  onRowClick && "cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/40",
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TableSkeleton({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft" role="status" aria-label="Loading">
      <Skeleton className="mb-4 h-4 w-1/3" />
      <div className="grid gap-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((__, c) => (
              <Skeleton key={c} className="h-5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Pill-style single-select filter used above lists (stages, categories, views). */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-white/20" : "bg-muted text-muted-foreground")}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
