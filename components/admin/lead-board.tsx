"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { Lead, PipelineStage } from "@/types";
import { LEAD_SOURCE_LABEL, PIPELINE_STAGES } from "@/lib/constants";
import { cn, timeAgo } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadScoreBadge, PurchaseIntentBadge } from "@/components/shared/status-badges";

/**
 * Kanban view of the pipeline. Cards can be dragged between columns, or moved
 * with the per-card menu (keyboard and touch friendly).
 */
export function LeadBoard({
  leads,
  productName,
  onMove,
}: {
  leads: Lead[];
  productName: (slug?: string) => string;
  onMove: (lead: Lead, stage: PipelineStage) => void;
}) {
  const [dragOver, setDragOver] = React.useState<PipelineStage | null>(null);
  const [dragging, setDragging] = React.useState<string | null>(null);

  return (
    <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
      <div className="grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-4">
        {PIPELINE_STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage.id);
          return (
            <section
              key={stage.id}
              aria-label={`${stage.label} (${items.length})`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(stage.id);
              }}
              onDragLeave={() => setDragOver((s) => (s === stage.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const lead = leads.find((l) => l.id === e.dataTransfer.getData("text/plain"));
                if (lead && lead.stage !== stage.id) onMove(lead, stage.id);
              }}
              className={cn(
                "flex min-h-72 flex-col rounded-xl border bg-muted/50 p-2.5 transition-colors",
                dragOver === stage.id && "border-primary bg-primary-soft/50",
              )}
            >
              <header className="mb-2 flex items-center justify-between px-1.5 py-1">
                <h3 className="text-sm font-semibold">{stage.label}</h3>
                <span className="rounded-full bg-card px-2 text-xs font-medium text-muted-foreground tabular-nums">{items.length}</span>
              </header>
              <ul className="grid gap-2">
                {items.map((lead) => (
                  <li
                    key={lead.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", lead.id);
                      setDragging(lead.id);
                    }}
                    onDragEnd={() => setDragging(null)}
                    className={cn(
                      "group cursor-grab rounded-lg border bg-card p-3 shadow-soft transition-opacity active:cursor-grabbing",
                      dragging === lead.id && "opacity-40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.name}
                      </Link>
                      <div className="flex items-center gap-1">
                        <LeadScoreBadge score={lead.leadScore} />
                        <DropdownMenu>
                          <DropdownMenuTrigger className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label={`Move ${lead.name} to another stage`}>
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={lead.stage} onValueChange={(v) => onMove(lead, v as PipelineStage)}>
                              {PIPELINE_STAGES.map((s) => (
                                <DropdownMenuRadioItem key={s.id} value={s.id}>
                                  {s.label}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {lead.interests.length
                        ? lead.interests.map((i) => `${productName(i.productSlug)}${i.quantity ? ` ×${i.quantity}` : ""}`).join(", ")
                        : "No product yet"}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>{LEAD_SOURCE_LABEL[lead.source]}</span>
                      <span>{timeAgo(lead.lastActivityAt)}</span>
                    </div>
                    {lead.purchaseIntent === "high" && !["converted", "lost"].includes(lead.stage) && (
                      <div className="mt-2">
                        <PurchaseIntentBadge intent="high" />
                      </div>
                    )}
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">Drop leads here</li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
