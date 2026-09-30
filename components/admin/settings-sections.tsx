"use client";

import * as React from "react";
import Link from "next/link";
import { FileUp, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { KnowledgeSource, NotificationSetting, SiteConfig } from "@/types";
import { addKnowledgeSource, setKnowledgeSourceApproved, updateNotificationSetting, updateSiteConfig } from "@/services/settings";
import { formatDate, isValidEmail, isValidPHMobile } from "@/lib/utils";
import { PH_LOCATIONS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/shared/form-field";
import { SocialIcon } from "@/components/layout/brand";

export function SettingsCard({
  id,
  title,
  description,
  children,
  footer,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-24">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-4 p-5">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t px-5 py-3">{footer}</div>}
    </Card>
  );
}

/** Local draft of the site config with dirty tracking and a save helper per section. */
export function useConfigDraft(config: SiteConfig, onSaved: (c: SiteConfig) => void) {
  const [draft, setDraft] = React.useState(config);
  const [saving, setSaving] = React.useState<string | null>(null);
  React.useEffect(() => setDraft(config), [config]);

  async function save(section: string, keys: (keyof SiteConfig)[], validate?: () => string | null) {
    const error = validate?.();
    if (error) return toast.error(error);
    setSaving(section);
    try {
      const patch = Object.fromEntries(keys.map((k) => [k, draft[k]])) as Partial<SiteConfig>;
      onSaved(await updateSiteConfig(patch));
      toast.success(`${section} saved`);
    } catch {
      toast.error("Couldn't save. Please try again.");
    } finally {
      setSaving(null);
    }
  }
  const dirty = (keys: (keyof SiteConfig)[]) => keys.some((k) => JSON.stringify(draft[k]) !== JSON.stringify(config[k]));
  return { draft, setDraft, save, saving, dirty };
}

type Draft = ReturnType<typeof useConfigDraft>;

function SaveButton({ d, section, keys, validate }: { d: Draft; section: string; keys: (keyof SiteConfig)[]; validate?: () => string | null }) {
  return (
    <Button size="sm" disabled={!d.dirty(keys)} loading={d.saving === section} onClick={() => d.save(section, keys, validate)}>
      Save changes
    </Button>
  );
}

export function BusinessSection({ d }: { d: Draft }) {
  return (
    <SettingsCard id="business" title="Business profile" description="Shown in the header, footer, and AI greeting." footer={<SaveButton d={d} section="Business profile" keys={["storeName", "tagline"]} validate={() => (d.draft.storeName.trim() ? null : "Store name is required.")} />}>
      <FormField id="s-store" label="Store name">
        {(p) => <Input {...p} value={d.draft.storeName} onChange={(e) => d.setDraft({ ...d.draft, storeName: e.target.value })} />}
      </FormField>
      <FormField id="s-tagline" label="Tagline">
        {(p) => <Input {...p} value={d.draft.tagline} onChange={(e) => d.setDraft({ ...d.draft, tagline: e.target.value })} />}
      </FormField>
    </SettingsCard>
  );
}

export function SellerSection({ d }: { d: Draft }) {
  const s = d.draft.seller;
  const set = (patch: Partial<SiteConfig["seller"]>) => d.setDraft({ ...d.draft, seller: { ...s, ...patch } });
  return (
    <SettingsCard id="seller" title="Seller profile" description="Displayed on the About page and in the independent-distributor notice." footer={<SaveButton d={d} section="Seller profile" keys={["seller"]} validate={() => (s.name.trim() ? null : "Seller name is required.")} />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="s-seller" label="Name">{(p) => <Input {...p} value={s.name} onChange={(e) => set({ name: e.target.value })} />}</FormField>
        <FormField id="s-role" label="Role">{(p) => <Input {...p} value={s.role} onChange={(e) => set({ role: e.target.value })} />}</FormField>
        <FormField id="s-dist" label="Distributor ID" hint="Shown in the footer.">{(p) => <Input {...p} value={s.distributorId} onChange={(e) => set({ distributorId: e.target.value })} />}</FormField>
      </div>
      <FormField id="s-bio" label="Bio">{(p) => <Textarea {...p} value={s.bio} onChange={(e) => set({ bio: e.target.value })} />}</FormField>
    </SettingsCard>
  );
}

export function ContactSection({ d }: { d: Draft }) {
  const c = d.draft.contact;
  const set = (patch: Partial<SiteConfig["contact"]>) => d.setDraft({ ...d.draft, contact: { ...c, ...patch } });
  const validate = () => (!isValidPHMobile(c.mobile) ? "Enter a valid PH mobile number." : !isValidEmail(c.email) ? "Enter a valid email." : null);
  return (
    <SettingsCard id="contact" title="Contact information" footer={<SaveButton d={d} section="Contact information" keys={["contact"]} validate={validate} />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="s-mobile" label="Mobile">{(p) => <Input {...p} value={c.mobile} onChange={(e) => set({ mobile: e.target.value })} inputMode="tel" />}</FormField>
        <FormField id="s-email" label="Email">{(p) => <Input {...p} type="email" value={c.email} onChange={(e) => set({ email: e.target.value })} />}</FormField>
        <FormField id="s-messenger" label="Messenger page">{(p) => <Input {...p} value={c.messenger} onChange={(e) => set({ messenger: e.target.value })} />}</FormField>
        <FormField id="s-hours" label="Store hours">{(p) => <Input {...p} value={c.hours} onChange={(e) => set({ hours: e.target.value })} />}</FormField>
      </div>
      <FormField id="s-address" label="Address / pick-up point">{(p) => <Input {...p} value={c.address} onChange={(e) => set({ address: e.target.value })} />}</FormField>
    </SettingsCard>
  );
}

export function SocialSection({ d }: { d: Draft }) {
  return (
    <SettingsCard id="social" title="Social channels" footer={<SaveButton d={d} section="Social channels" keys={["socials"]} validate={() => (d.draft.socials.every((s) => /^https?:\/\//.test(s.url)) ? null : "Links must start with https://")} />}>
      {d.draft.socials.map((s, i) => (
        <div key={s.platform} className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted"><SocialIcon platform={s.platform} /></span>
          <label htmlFor={`social-${s.platform}`} className="sr-only">{s.label} link</label>
          <Input id={`social-${s.platform}`} value={s.url} onChange={(e) => d.setDraft({ ...d.draft, socials: d.draft.socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
        </div>
      ))}
    </SettingsCard>
  );
}

export function DeliverySection({ d }: { d: Draft }) {
  const [adding, setAdding] = React.useState("");
  const areas = d.draft.deliveryAreas;
  const options = PH_LOCATIONS.filter((l) => !areas.includes(l));
  return (
    <SettingsCard id="delivery" title="Delivery areas" description="The AI uses this list to tell customers whether you deliver to them." footer={<SaveButton d={d} section="Delivery areas" keys={["deliveryAreas"]} validate={() => (areas.length ? null : "Add at least one delivery area.")} />}>
      <ul className="flex flex-wrap gap-2" aria-label="Delivery areas">
        {areas.map((a) => (
          <li key={a} className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pr-1 pl-3 text-sm">
            {a}
            <button type="button" onClick={() => d.setDraft({ ...d.draft, deliveryAreas: areas.filter((x) => x !== a) })} className="rounded-full p-0.5 hover:bg-card" aria-label={`Remove ${a}`}>
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <NativeSelect aria-label="Add delivery area" value={adding} onChange={(e) => setAdding(e.target.value)} wrapperClassName="flex-1">
          <option value="">Choose a city or municipality…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </NativeSelect>
        <Button variant="outline" disabled={!adding} onClick={() => { d.setDraft({ ...d.draft, deliveryAreas: [...areas, adding] }); setAdding(""); }}>
          <Plus aria-hidden /> Add
        </Button>
      </div>
    </SettingsCard>
  );
}

export function PaymentSection({ d }: { d: Draft }) {
  return (
    <SettingsCard id="payments" title="Payment methods" description="Shown to customers after you confirm an order. Online payments will be available once the backend is connected." footer={<SaveButton d={d} section="Payment methods" keys={["paymentMethods"]} />}>
      {d.draft.paymentMethods.map((m, i) => (
        <label key={m.id} className="flex items-center justify-between gap-3 text-sm">
          <span>{m.label}</span>
          <Switch
            checked={m.enabled}
            disabled={m.id === "card"}
            onCheckedChange={(on) => d.setDraft({ ...d.draft, paymentMethods: d.draft.paymentMethods.map((x, j) => (j === i ? { ...x, enabled: on } : x)) })}
            aria-label={m.label}
          />
        </label>
      ))}
    </SettingsCard>
  );
}

export function AISettingsSection({ active, autonomyLabel }: { active: boolean; autonomyLabel: string }) {
  return (
    <SettingsCard id="ai" title="AI settings">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        Assistant status <Badge variant={active ? "success" : "neutral"} dot>{active ? "Active" : "Paused"}</Badge>
        · Autonomy <Badge variant="brand">{autonomyLabel}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">Capabilities, guardrails, autonomy, and the greeting are managed in the AI Agent Control Center.</p>
      <Button variant="outline" asChild className="justify-self-start">
        <Link href="/admin/ai-agent">Open AI Agent Control Center</Link>
      </Button>
    </SettingsCard>
  );
}

export function NotificationSection({ settings, onChange }: { settings: NotificationSetting[]; onChange: (s: NotificationSetting[]) => void }) {
  async function toggle(id: string, channel: "email" | "push", value: boolean) {
    onChange(settings.map((s) => (s.id === id ? { ...s, [channel]: value } : s)));
    onChange(await updateNotificationSetting(id, channel, value));
  }
  return (
    <SettingsCard id="notifications" title="Notification settings" description="Changes save automatically.">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th scope="col" className="pb-2 font-medium">Event</th>
              <th scope="col" className="w-16 pb-2 text-center font-medium">Email</th>
              <th scope="col" className="w-16 pb-2 text-center font-medium">Push</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {settings.map((s) => (
              <tr key={s.id}>
                <td className="py-3 pr-3">
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </td>
                <td className="text-center"><Switch checked={s.email} onCheckedChange={(v) => void toggle(s.id, "email", v)} aria-label={`${s.label} email`} /></td>
                <td className="text-center"><Switch checked={s.push} onCheckedChange={(v) => void toggle(s.id, "push", v)} aria-label={`${s.label} push`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsCard>
  );
}

export function LegalSection({ d }: { d: Draft }) {
  const dis = d.draft.disclaimers;
  const set = (patch: Partial<SiteConfig["disclaimers"]>) => d.setDraft({ ...d.draft, disclaimers: { ...dis, ...patch } });
  const fields: { key: keyof SiteConfig["disclaimers"]; label: string; hint: string }[] = [
    { key: "independentSeller", label: "Independent seller notice", hint: "Required: make clear this isn't the official corporate website." },
    { key: "health", label: "Health disclaimer", hint: "Shown in the footer, product pages, and articles." },
    { key: "ai", label: "AI chat disclaimer", hint: "Shown at the top of every chat." },
    { key: "pricing", label: "Pricing notice", hint: "Shown on the order inquiry and terms pages." },
  ];
  return (
    <SettingsCard id="legal" title="Legal / disclaimer" footer={<SaveButton d={d} section="Disclaimers" keys={["disclaimers"]} validate={() => (Object.values(dis).every((v) => v.trim().length > 10) ? null : "Disclaimers can't be empty.")} />}>
      {fields.map((f) => (
        <FormField key={f.key} id={`dis-${f.key}`} label={f.label} hint={f.hint}>
          {(p) => <Textarea {...p} value={dis[f.key]} onChange={(e) => set({ [f.key]: e.target.value })} className="min-h-20" />}
        </FormField>
      ))}
    </SettingsCard>
  );
}

export function KnowledgeSection({ sources, onChange }: { sources: KnowledgeSource[]; onChange: (s: KnowledgeSource[]) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const TYPE_LABEL: Record<KnowledgeSource["type"], string> = { product_catalog: "Catalog", faq: "FAQ", document: "Document", policy: "Policy" };

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("Files must be 10 MB or smaller.");
    setUploading(true);
    try {
      onChange(await addKnowledgeSource(file.name));
      toast.success(`${file.name} added. Review and approve it before the AI can use it.`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <SettingsCard id="knowledge" title="Product knowledge sources" description="The AI only answers from approved sources.">
      <ul className="divide-y">
        {sources.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{TYPE_LABEL[s.type]} · {s.items} item{s.items === 1 ? "" : "s"} · updated {formatDate(s.updatedAt)}</p>
            </div>
            <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              {s.approved ? "Approved" : "Not approved"}
              <Switch
                checked={s.approved}
                onCheckedChange={async (v) => {
                  onChange(await setKnowledgeSourceApproved(s.id, v));
                  toast.success(v ? `${s.name} approved for AI` : `${s.name} removed from AI knowledge`);
                }}
                aria-label={`Approve ${s.name}`}
              />
            </label>
          </li>
        ))}
      </ul>
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv" className="sr-only" onChange={onFile} aria-label="Upload knowledge document" />
      <Button variant="outline" className="justify-self-start" onClick={() => inputRef.current?.click()} loading={uploading}>
        <FileUp aria-hidden /> Upload document
      </Button>
    </SettingsCard>
  );
}
