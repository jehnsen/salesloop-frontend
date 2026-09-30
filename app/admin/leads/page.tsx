"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus, CheckCircle2, Download, Eye, Kanban, List, MoreHorizontal, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Lead, PipelineStage } from "@/types";
import { getLeads, updateLeadStage, type LeadFilters } from "@/services/leads";
import { useAsync, useDbChange } from "@/lib/hooks/use-async";
import { useProductLookup } from "@/lib/hooks/use-products";
import { downloadCsv } from "@/lib/csv";
import { CHANNEL_LABEL, LEAD_SOURCE_LABEL, PIPELINE_STAGES, STAGE_LABEL } from "@/lib/constants";
import { friendlyDay, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NativeSelect } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, FilterChips, TableSkeleton } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { ErrorState } from "@/components/shared/states";
import { LeadScoreBadge, PipelineStageBadge, PurchaseIntentBadge } from "@/components/shared/status-badges";
import { AdminPageHeader } from "@/components/admin/primitives";
import { CreateFollowUpDialog, type FollowUpTarget } from "@/components/admin/create-follow-up-dialog";
import { LeadBoard } from "@/components/admin/lead-board";

export default function LeadsPage() {
  return (
    <React.Suspense fallback={<TableSkeleton />}>
      <LeadsView />
    </React.Suspense>
  );
}

type View = "list" | "board";

function LeadsView() {
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = React.useState<View>("list");
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Omit<LeadFilters, "search">>({
    stage: "all",
    intent: params.get("intent") === "high" ? "high" : "all",
    minScore: 0,
    product: "all",
    source: "all",
    followUp: "all",
    createdWithinDays: 0,
  });
  const { products, name } = useProductLookup();
  const all = useAsync(() => getLeads({ ...filters, stage: "all", search }), [filters, search]);
  const [followUpTarget, setFollowUpTarget] = React.useState<FollowUpTarget | null>(null);
  const [losing, setLosing] = React.useState<Lead | null>(null);

  useDbChange(() => void all.reload({ silent: true }));

  const rows = (all.data ?? []).filter((l) => filters.stage === "all" || l.stage === filters.stage);
  const stageCounts = PIPELINE_STAGES.map((s) => ({ ...s, count: all.data?.filter((l) => l.stage === s.id).length ?? 0 }));
  const set = (patch: Partial<LeadFilters>) => setFilters((f) => ({ ...f, ...patch }));

  async function move(lead: Lead, stage: PipelineStage, reason?: string) {
    const previous = all.data;
    all.setData((list) => list?.map((l) => (l.id === lead.id ? { ...l, stage } : l)));
    try {
      await updateLeadStage(lead.id, stage, reason);
      toast.success(`${lead.name} moved to ${STAGE_LABEL[stage]}`);
    } catch {
      all.setData(previous);
      toast.error("Couldn't update the stage.");
    }
  }

  function exportCsv() {
    downloadCsv(
      `leads-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Mobile", "Email", "Location", "Source", "Products", "Score", "Intent", "Stage", "Last activity", "Next follow-up"],
      rows.map((l) => [
        l.name, l.mobile, l.email, l.location, LEAD_SOURCE_LABEL[l.source],
        l.interests.map((i) => `${name(i.productSlug)}${i.quantity ? ` x${i.quantity}` : ""}`).join("; "),
        l.leadScore, l.purchaseIntent, STAGE_LABEL[l.stage], l.lastActivityAt, l.nextFollowUpAt,
      ]),
    );
    toast.success(`Exported ${rows.length} leads`);
  }

  const actions = (l: Lead) => (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label={`Actions for ${l.name}`} onClick={(e) => e.stopPropagation()}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem asChild>
          <Link href={`/admin/leads/${l.id}`}><Eye /> View details</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            setFollowUpTarget({ customerName: l.name, leadId: l.id, productSlug: l.interests[0]?.productSlug, channel: l.preferredChannel })
          }
        >
          <CalendarPlus /> Create follow-up
        </DropdownMenuItem>
        {!["qualified", "converted"].includes(l.stage) && (
          <DropdownMenuItem onSelect={() => move(l, "qualified", "Marked qualified by seller")}>
            <CheckCircle2 /> Mark qualified
          </DropdownMenuItem>
        )}
        {l.stage !== "lost" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => setLosing(l)}>
              <XCircle /> Mark lost
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <AdminPageHeader
        title="Leads"
        description="Everyone who showed interest, scored and qualified by the AI."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>
              <Download aria-hidden /> Export CSV
            </Button>
            <Tabs value={view} onValueChange={(v) => setView(v as View)}>
              <TabsList aria-label="Layout">
                <TabsTrigger value="list"><List aria-hidden /> List</TabsTrigger>
                <TabsTrigger value="board"><Kanban aria-hidden /> Kanban</TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        }
      />

      <Card className="mb-4 space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] xl:grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,1fr))]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, mobile, location…" label="Search leads" />
          <NativeSelect aria-label="Lead score" value={`${filters.intent === "high" ? "high" : filters.minScore}`} onChange={(e) => {
            const v = e.target.value;
            set(v === "high" ? { intent: "high", minScore: 0 } : { intent: "all", minScore: Number(v) });
          }}>
            <option value="0">Any score</option>
            <option value="50">Score 50+</option>
            <option value="80">Score 80+</option>
            <option value="high">High intent only</option>
          </NativeSelect>
          <NativeSelect aria-label="Product interest" value={filters.product} onChange={(e) => set({ product: e.target.value })}>
            <option value="all">All products</option>
            {products.filter((p) => !p.archived).map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Source" value={filters.source} onChange={(e) => set({ source: e.target.value as LeadFilters["source"] })}>
            <option value="all">All sources</option>
            {Object.entries(LEAD_SOURCE_LABEL).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Created" value={filters.createdWithinDays} onChange={(e) => set({ createdWithinDays: Number(e.target.value) })}>
            <option value={0}>Any date</option>
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
          </NativeSelect>
          <NativeSelect aria-label="Follow-up status" value={filters.followUp} onChange={(e) => set({ followUp: e.target.value as LeadFilters["followUp"] })}>
            <option value="all">Any follow-up</option>
            <option value="due">Due today / overdue</option>
            <option value="scheduled">Has follow-up</option>
            <option value="none">No follow-up</option>
          </NativeSelect>
        </div>
        {view === "list" && (
          <FilterChips
            label="Pipeline stage"
            value={filters.stage ?? "all"}
            onChange={(stage) => set({ stage })}
            options={[
              { id: "all", label: "All", count: all.data?.length ?? 0 },
              ...stageCounts.map((s) => ({ id: s.id, label: s.label, count: s.count })),
            ]}
          />
        )}
      </Card>

      {all.error ? (
        <ErrorState action={<Button variant="outline" onClick={() => all.reload()}>Retry</Button>} />
      ) : view === "board" ? (
        all.loading ? <TableSkeleton /> : <LeadBoard leads={all.data ?? []} productName={name} onMove={(l, s) => move(l, s)} />
      ) : (
        <DataTable
          loading={all.loading}
          rows={rows}
          rowKey={(l) => l.id}
          caption="Leads"
          onRowClick={(l) => router.push(`/admin/leads/${l.id}`)}
          empty={{ title: "No leads match these filters", description: "Try clearing a filter or searching by a different name." }}
          columns={[
            {
              key: "lead",
              header: "Lead",
              cell: (l) => (
                <div className="flex items-center gap-2.5">
                  <Avatar name={l.name} className="size-8" />
                  <div>
                    <p className="font-medium whitespace-nowrap">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.location ?? "—"}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "contact",
              header: "Contact",
              cell: (l) => (
                <div className="text-xs whitespace-nowrap">
                  <p>{l.mobile ?? l.messengerName ?? "—"}</p>
                  <p className="text-muted-foreground">{CHANNEL_LABEL[l.preferredChannel]}</p>
                </div>
              ),
            },
            { key: "source", header: "Source", cell: (l) => <span className="whitespace-nowrap">{LEAD_SOURCE_LABEL[l.source]}</span> },
            {
              key: "product",
              header: "Product interest",
              cell: (l) => (
                <span className="line-clamp-2 min-w-36">
                  {l.interests.length ? l.interests.map((i) => `${name(i.productSlug)}${i.quantity ? ` ×${i.quantity}` : ""}`).join(", ") : "—"}
                </span>
              ),
            },
            { key: "score", header: "Score", cell: (l) => <LeadScoreBadge score={l.leadScore} /> },
            { key: "intent", header: "Intent", cell: (l) => <PurchaseIntentBadge intent={l.purchaseIntent} /> },
            { key: "stage", header: "Stage", cell: (l) => <PipelineStageBadge stage={l.stage} /> },
            { key: "activity", header: "Last activity", cell: (l) => <span className="whitespace-nowrap text-muted-foreground">{timeAgo(l.lastActivityAt)}</span> },
            { key: "next", header: "Next follow-up", cell: (l) => <span className="whitespace-nowrap text-muted-foreground">{l.nextFollowUpAt ? friendlyDay(l.nextFollowUpAt) : "—"}</span> },
            { key: "assigned", header: "Assigned", cell: (l) => <span className="whitespace-nowrap">{l.assignedTo.split(" ")[0]}</span> },
            { key: "actions", header: <span className="sr-only">Actions</span>, cell: actions, className: "w-10" },
          ]}
          mobileCard={(l) => (
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <Avatar name={l.name} />
                <Link href={`/admin/leads/${l.id}`} className="min-w-0 flex-1">
                  <p className="font-medium">{l.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {l.interests[0] ? name(l.interests[0].productSlug) : "No product yet"} · {LEAD_SOURCE_LABEL[l.source]}
                  </p>
                </Link>
                {actions(l)}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <LeadScoreBadge score={l.leadScore} />
                <PipelineStageBadge stage={l.stage} />
                <PurchaseIntentBadge intent={l.purchaseIntent} />
                <span className="ml-auto text-xs text-muted-foreground">{timeAgo(l.lastActivityAt)}</span>
              </div>
            </div>
          )}
        />
      )}

      <CreateFollowUpDialog
        target={followUpTarget}
        open={Boolean(followUpTarget)}
        onOpenChange={(o) => !o && setFollowUpTarget(null)}
      />
      <ConfirmDialog
        open={Boolean(losing)}
        onOpenChange={(o) => !o && setLosing(null)}
        title={`Mark ${losing?.name} as lost?`}
        description="The lead stays in your records and can be moved back anytime. Scheduled follow-ups will stop."
        confirmLabel="Mark lost"
        destructive
        onConfirm={async () => {
          if (losing) await move(losing, "lost", "Marked lost by seller");
        }}
      />
    </>
  );
}
