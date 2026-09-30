"use client";

import * as React from "react";
import { Megaphone, Pause, Play, Plus, Target, Users } from "lucide-react";
import { toast } from "sonner";
import type { Campaign, CampaignStatus, ContentPlatform } from "@/types";
import { createCampaign, getCampaigns, updateCampaignStatus, type CreateCampaignInput } from "@/services/campaigns";
import { useAsync } from "@/lib/hooks/use-async";
import { useProductLookup } from "@/lib/hooks/use-products";
import { CONTENT_PLATFORM_LABEL } from "@/lib/constants";
import { formatCompactPeso, formatDate, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/misc";
import { FilterChips } from "@/components/shared/data-table";
import { FormField } from "@/components/shared/form-field";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { CampaignStatusBadge } from "@/components/shared/status-badges";
import { FunnelBars } from "@/components/admin/charts";
import { AdminPageHeader, PanelSkeleton } from "@/components/admin/primitives";

export default function CampaignsPage() {
  const campaigns = useAsync(getCampaigns);
  const { name } = useProductLookup();
  const [status, setStatus] = React.useState<CampaignStatus | "all">("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const all = campaigns.data ?? [];
  const rows = all.filter((c) => status === "all" || c.status === status);
  const replace = (u: Campaign) => campaigns.setData((list) => list?.map((c) => (c.id === u.id ? u : c)));

  async function setCampaignStatus(c: Campaign, to: CampaignStatus, message: string) {
    replace(await updateCampaignStatus(c.id, to));
    toast.success(message);
  }

  return (
    <>
      <AdminPageHeader
        title="Campaigns"
        description="Track each campaign from impressions to orders."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus aria-hidden /> New campaign</Button>}
      />
      <FilterChips
        className="mb-5"
        label="Campaign status"
        value={status}
        onChange={setStatus}
        options={[
          { id: "all", label: "All", count: all.length },
          ...(["active", "paused", "draft", "completed"] as CampaignStatus[]).map((s) => ({
            id: s,
            label: s[0].toUpperCase() + s.slice(1),
            count: all.filter((c) => c.status === s).length,
          })),
        ]}
      />

      {campaigns.error ? (
        <ErrorState action={<Button onClick={() => campaigns.reload()}>Retry</Button>} />
      ) : campaigns.loading ? (
        <div className="grid gap-5 xl:grid-cols-2"><PanelSkeleton rows={6} /><PanelSkeleton rows={6} /></div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns here" action={<Button onClick={() => setCreateOpen(true)}>Create a campaign</Button>} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {rows.map((c) => {
            const f = c.funnel;
            const conv = f.leads ? ((f.orders / f.leads) * 100).toFixed(0) : "0";
            return (
              <Card key={c.id} className="flex flex-col">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{c.name}</h2>
                      <CampaignStatusBadge status={c.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(c.startDate)}
                      {c.endDate ? ` – ${formatDate(c.endDate)}` : " · ongoing"}
                    </p>
                  </div>
                  {c.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => setCampaignStatus(c, "paused", `${c.name} paused`)}><Pause aria-hidden /> Pause</Button>
                  )}
                  {c.status === "paused" && (
                    <Button size="sm" onClick={() => setCampaignStatus(c, "active", `${c.name} resumed`)}><Play aria-hidden /> Resume</Button>
                  )}
                  {c.status === "draft" && (
                    <Button size="sm" onClick={() => setCampaignStatus(c, "active", `${c.name} launched`)}><Play aria-hidden /> Launch</Button>
                  )}
                </div>
                <div className="grid gap-5 p-5">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="flex gap-2"><Target className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /><div><dt className="text-xs text-muted-foreground">Objective</dt><dd>{c.objective}</dd></div></div>
                    <div className="flex gap-2"><Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /><div><dt className="text-xs text-muted-foreground">Target audience</dt><dd>{c.targetAudience}</dd></div></div>
                    <div><dt className="text-xs text-muted-foreground">Products</dt><dd>{c.productSlugs.map(name).join(", ")}</dd></div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Channels</dt>
                      <dd className="mt-1 flex flex-wrap gap-1">{c.channels.map((ch) => <span key={ch} className="rounded-full bg-muted px-2 py-0.5 text-xs">{CONTENT_PLATFORM_LABEL[ch]}</span>)}</dd>
                    </div>
                  </dl>
                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Leads", value: formatNumber(f.leads) },
                      { label: "Conversations", value: formatNumber(f.conversations) },
                      { label: "Orders", value: formatNumber(f.orders) },
                      { label: "Est. revenue", value: formatCompactPeso(c.estimatedRevenue) },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl bg-muted/60 p-3">
                        <dt className="text-xs text-muted-foreground">{m.label}</dt>
                        <dd className="text-lg font-semibold tabular-nums">{m.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {f.impressions > 0 ? (
                    <div>
                      <p className="mb-3 text-sm font-medium">Campaign funnel <span className="font-normal text-muted-foreground">· {conv}% of leads ordered</span></p>
                      <FunnelBars
                        steps={[
                          { label: "Impressions", value: f.impressions },
                          { label: "Visits", value: f.visits },
                          { label: "Conversations", value: f.conversations },
                          { label: "Leads", value: f.leads },
                          { label: "Orders", value: f.orders },
                        ]}
                      />
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">No results yet. Launch the campaign to start tracking.</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCampaignDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(c) => {
          campaigns.setData((list) => [c, ...(list ?? [])]);
          setStatus("all");
        }}
      />
    </>
  );
}

const CHANNELS: ContentPlatform[] = ["facebook", "instagram", "tiktok", "messenger_broadcast", "blog", "educational"];

function CreateCampaignDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (c: Campaign) => void }) {
  const { products } = useProductLookup();
  const empty: CreateCampaignInput = { name: "", objective: "", targetAudience: "", productSlugs: [], channels: [] };
  const [v, setV] = React.useState(empty);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setV(empty);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = <K extends "productSlugs" | "channels">(key: K, value: CreateCampaignInput[K][number]) =>
    setV((s) => ({ ...s, [key]: (s[key] as string[]).includes(value) ? (s[key] as string[]).filter((x) => x !== value) : [...s[key], value] }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!v.name.trim()) next.name = "Give the campaign a name.";
    if (!v.objective.trim()) next.objective = "What should this campaign achieve?";
    if (!v.productSlugs.length) next.products = "Pick at least one product.";
    if (!v.channels.length) next.channels = "Pick at least one channel.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const c = await createCampaign(v);
      onCreated(c);
      toast.success(`${c.name} created as a draft`);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>New campaign</DialogTitle>
            <DialogDescription>Campaigns start as drafts. Launch when you&apos;re ready.</DialogDescription>
          </DialogHeader>
          <FormField id="c-name" label="Campaign name" error={errors.name}>
            {(p) => <Input {...p} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="e.g. Rainy Season Cocoa" />}
          </FormField>
          <FormField id="c-objective" label="Objective" error={errors.objective}>
            {(p) => <Textarea {...p} value={v.objective} onChange={(e) => setV({ ...v, objective: e.target.value })} className="min-h-16" />}
          </FormField>
          <FormField id="c-audience" label="Target audience" optional>
            {(p) => <Input {...p} value={v.targetAudience} onChange={(e) => setV({ ...v, targetAudience: e.target.value })} />}
          </FormField>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Products</legend>
            <div className="grid max-h-40 gap-2 overflow-y-auto rounded-xl border p-3 sm:grid-cols-2">
              {products.filter((p) => !p.archived).map((p) => (
                <label key={p.slug} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={v.productSlugs.includes(p.slug)} onCheckedChange={() => toggle("productSlugs", p.slug)} />
                  {p.name}
                </label>
              ))}
            </div>
            {errors.products && <p className="text-xs font-medium text-destructive">{errors.products}</p>}
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Channels</legend>
            <div className="flex flex-wrap gap-3">
              {CHANNELS.map((ch) => (
                <label key={ch} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={v.channels.includes(ch)} onCheckedChange={() => toggle("channels", ch)} />
                  {CONTENT_PLATFORM_LABEL[ch]}
                </label>
              ))}
            </div>
            {errors.channels && <p className="text-xs font-medium text-destructive">{errors.channels}</p>}
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create campaign</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
