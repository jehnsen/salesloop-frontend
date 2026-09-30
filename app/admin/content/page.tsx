"use client";

import * as React from "react";
import { Copy, Eye, MousePointerClick, MoreHorizontal, Pencil, Sparkles, Trash2, UserPlus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { ContentItem, ContentPlatform, ContentStatus, GenerateContentInput } from "@/types";
import { deleteContent, generateContent, getContentItems, updateContent, updateContentStatus } from "@/services/content";
import { getCampaigns } from "@/services/campaigns";
import { useAsync } from "@/lib/hooks/use-async";
import { useProductLookup } from "@/lib/hooks/use-products";
import { CONTENT_PLATFORM_LABEL, CONTENT_STATUSES } from "@/lib/constants";
import { formatCompactNumber, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FilterChips } from "@/components/shared/data-table";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { AIBadge, ContentStatusBadge } from "@/components/shared/status-badges";
import { AdminPageHeader, PanelSkeleton } from "@/components/admin/primitives";

const NEXT_STATUS: Partial<Record<ContentStatus, { to: ContentStatus; label: string }>> = {
  idea: { to: "draft", label: "Move to draft" },
  draft: { to: "approved", label: "Approve" },
  approved: { to: "published", label: "Mark published" },
};

export default function ContentPage() {
  const items = useAsync(getContentItems);
  const campaigns = useAsync(getCampaigns);
  const [status, setStatus] = React.useState<ContentStatus | "all">("all");
  const [platform, setPlatform] = React.useState<ContentPlatform | "all">("all");
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ContentItem | null>(null);
  const [deleting, setDeleting] = React.useState<ContentItem | null>(null);

  const all = items.data ?? [];
  const rows = all.filter((c) => (status === "all" || c.status === status) && (platform === "all" || c.platform === platform));
  const campaignName = (id?: string) => campaigns.data?.find((c) => c.id === id)?.name;
  const replace = (u: ContentItem) => items.setData((list) => list?.map((c) => (c.id === u.id ? u : c)));

  async function advance(item: ContentItem, to: ContentStatus) {
    replace(await updateContentStatus(item.id, to));
    toast.success(`“${item.title}” is now ${CONTENT_STATUSES.find((s) => s.id === to)?.label}`);
  }

  return (
    <>
      <AdminPageHeader
        title="Content"
        description="Plan posts, captions, scripts, and promos. Everything stays compliant: no health claims."
        actions={<Button onClick={() => setGenerateOpen(true)}><Wand2 aria-hidden /> Generate Content</Button>}
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <FilterChips
          label="Content status"
          value={status}
          onChange={setStatus}
          options={[
            { id: "all", label: "All", count: all.length },
            ...CONTENT_STATUSES.map((s) => ({ id: s.id, label: s.label, count: all.filter((c) => c.status === s.id).length })),
          ]}
        />
        <NativeSelect aria-label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)} wrapperClassName="lg:ml-auto lg:w-56">
          <option value="all">All platforms</option>
          {Object.entries(CONTENT_PLATFORM_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </NativeSelect>
      </div>

      {items.error ? (
        <ErrorState action={<Button onClick={() => items.reload()}>Retry</Button>} />
      ) : items.loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><PanelSkeleton /><PanelSkeleton /><PanelSkeleton /></div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Sparkles} title="No content here yet" description="Generate a first draft with AI, then edit and approve it." action={<Button onClick={() => setGenerateOpen(true)}>Generate Content</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => {
            const next = NEXT_STATUS[c.status];
            return (
              <Card key={c.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ContentStatusBadge status={c.status} />
                    <span className="rounded-full border px-2 py-0.5 text-xs">{CONTENT_PLATFORM_LABEL[c.platform]}</span>
                    {c.aiGenerated && <AIBadge label="AI draft" />}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label={`Actions for ${c.title}`}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => setEditing(c)}><Pencil /> Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={async () => {
                          try {
                            await navigator.clipboard.writeText(c.body);
                            toast.success("Copied to clipboard");
                          } catch {
                            toast.error("Couldn't copy");
                          }
                        }}
                      >
                        <Copy /> Copy text
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onSelect={() => setDeleting(c)}><Trash2 /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {campaignName(c.campaignId) ? `${campaignName(c.campaignId)} · ` : ""}Created {formatDate(c.createdAt)}
                  </p>
                </div>
                <p className="line-clamp-4 flex-1 text-sm whitespace-pre-line text-muted-foreground">{c.body}</p>
                {c.metrics ? (
                  <dl className="grid grid-cols-4 gap-2 rounded-xl bg-muted/60 p-3 text-center">
                    {[
                      { icon: Eye, label: "Reach", v: c.metrics.reach },
                      { icon: Sparkles, label: "Engaged", v: c.metrics.engagements },
                      { icon: MousePointerClick, label: "Clicks", v: c.metrics.clicks },
                      { icon: UserPlus, label: "Leads", v: c.metrics.leads },
                    ].map((m) => (
                      <div key={m.label}>
                        <dt className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground"><m.icon className="size-3" aria-hidden />{m.label}</dt>
                        <dd className="text-sm font-semibold tabular-nums">{formatCompactNumber(m.v)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-xs text-muted-foreground">Metrics appear after publishing.</p>
                )}
                {next && (
                  <Button size="sm" variant={next.to === "approved" ? "default" : "outline"} onClick={() => advance(c, next.to)}>
                    {next.label}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <GenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        campaigns={(campaigns.data ?? []).map((c) => ({ id: c.id, name: c.name }))}
        onCreated={(item) => {
          items.setData((list) => [item, ...(list ?? [])]);
          setStatus("all");
        }}
      />
      <EditDialog item={editing} onClose={() => setEditing(null)} onSaved={replace} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.title}”?`}
        description="This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          await deleteContent(deleting.id);
          items.setData((list) => list?.filter((c) => c.id !== deleting.id));
          toast.success("Content deleted");
        }}
      />
    </>
  );
}

function GenerateDialog({
  open,
  onOpenChange,
  campaigns,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaigns: { id: string; name: string }[];
  onCreated: (item: ContentItem) => void;
}) {
  const { products } = useProductLookup();
  const approved = products.filter((p) => p.approvedForAI && !p.archived);
  const [input, setInput] = React.useState<GenerateContentInput>({ platform: "facebook", productSlug: "", goal: "awareness" });
  const [result, setResult] = React.useState<ContentItem | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) setResult(null);
  }, [open]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const productSlug = input.productSlug || approved[0]?.slug;
    if (!productSlug) return toast.error("Approve at least one product for AI first.");
    setLoading(true);
    try {
      const item = await generateContent({ ...input, productSlug });
      setResult(item);
      onCreated(item);
    } catch {
      toast.error("Couldn't generate content.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 className="size-5 text-leaf" aria-hidden /> Generate content</DialogTitle>
          <DialogDescription>The AI writes from approved product information only and saves the result as a draft for you to review.</DialogDescription>
        </DialogHeader>
        {result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><ContentStatusBadge status="draft" /><span className="text-sm font-medium">{result.title}</span></div>
            <pre className="max-h-72 overflow-y-auto rounded-xl bg-muted p-4 font-sans text-sm whitespace-pre-wrap">{result.body}</pre>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResult(null)}>Generate another</Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={run} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="g-platform" className="text-sm font-medium">Platform</label>
                <NativeSelect id="g-platform" value={input.platform} onChange={(e) => setInput({ ...input, platform: e.target.value as ContentPlatform })}>
                  {Object.entries(CONTENT_PLATFORM_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </NativeSelect>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="g-goal" className="text-sm font-medium">Goal</label>
                <NativeSelect id="g-goal" value={input.goal} onChange={(e) => setInput({ ...input, goal: e.target.value as GenerateContentInput["goal"] })}>
                  <option value="awareness">Awareness</option>
                  <option value="education">Education</option>
                  <option value="promotion">Promotion</option>
                  <option value="reorder">Reorder reminder</option>
                </NativeSelect>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="g-product" className="text-sm font-medium">Product</label>
                <NativeSelect id="g-product" value={input.productSlug || approved[0]?.slug || ""} onChange={(e) => setInput({ ...input, productSlug: e.target.value })}>
                  {approved.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                </NativeSelect>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="g-campaign" className="text-sm font-medium">Campaign <span className="font-normal text-muted-foreground">(optional)</span></label>
                <NativeSelect id="g-campaign" value={input.campaignId ?? ""} onChange={(e) => setInput({ ...input, campaignId: e.target.value || undefined })}>
                  <option value="">None</option>
                  {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </NativeSelect>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Only products marked “Approved for AI” are available.</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" loading={loading}><Sparkles aria-hidden /> Generate draft</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ item, onClose, onSaved }: { item: ContentItem | null; onClose: () => void; onSaved: (c: ContentItem) => void }) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    setTitle(item?.title ?? "");
    setBody(item?.body ?? "");
  }, [item]);
  return (
    <Dialog open={Boolean(item)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit content</DialogTitle>
        </DialogHeader>
        <div className="grid gap-1.5">
          <label htmlFor="e-title" className="text-sm font-medium">Title</label>
          <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="e-body" className="text-sm font-medium">Text</label>
          <Textarea id="e-body" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-48" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            loading={saving}
            disabled={!title.trim() || !body.trim()}
            onClick={async () => {
              if (!item) return;
              setSaving(true);
              try {
                onSaved(await updateContent(item.id, { title: title.trim(), body }));
                toast.success("Content saved");
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
