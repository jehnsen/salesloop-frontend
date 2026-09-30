"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, Store } from "lucide-react";
import type { ChatAttachment, ContactChannel, Product } from "@/types";
import { cn, formatPeso, isValidPHMobile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { StockBadge } from "@/components/shared/status-badges";
import { ProductImage } from "@/components/site/product-image";
import { useChat } from "./chat-provider";
import { MedicalNotice } from "./chat-primitives";

export function ChatAttachments({ attachments, isLatest }: { attachments: ChatAttachment[]; isLatest: boolean }) {
  const { products } = useChat();
  const find = (slug: string) => products.find((p) => p.slug === slug);
  return (
    <div className="grid w-full gap-2">
      {attachments.map((a, i) => {
        switch (a.type) {
          case "product_cards": {
            const list = a.productSlugs.map(find).filter((p): p is Product => Boolean(p));
            return <ProductMiniList key={i} products={list} />;
          }
          case "comparison": {
            const list = a.productSlugs.map(find).filter((p): p is Product => Boolean(p));
            return list.length === 2 ? <Comparison key={i} a={list[0]} b={list[1]} /> : null;
          }
          case "lead_form":
            return <LeadForm key={i} active={isLatest} />;
          case "order_link":
            return <OrderLink key={i} productSlug={a.productSlug} quantity={a.quantity} />;
          case "handoff":
            return <HandoffNotice key={i} />;
          case "medical_notice":
            return <MedicalNotice key={i} />;
        }
      })}
    </div>
  );
}

function ProductMiniList({ products }: { products: Product[] }) {
  const { closeChat } = useChat();
  if (!products.length) return null;
  return (
    <ul className="no-scrollbar -mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1">
      {products.map((p) => (
        <li key={p.slug} className="w-40 shrink-0">
          <Link
            href={`/products/${p.slug}`}
            onClick={() => closeChat()}
            className="block overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-soft"
          >
            <ProductImage visual={p.visual} tone={p.tone} name={p.name} className="aspect-[4/3]" />
            <div className="space-y-1 p-2.5">
              <p className="line-clamp-2 text-xs leading-snug font-medium">{p.name}</p>
              <p className="text-xs font-semibold text-primary">{formatPeso(p.price)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Comparison({ a, b }: { a: Product; b: Product }) {
  const rows: { label: string; get: (p: Product) => React.ReactNode }[] = [
    { label: "Type", get: (p) => p.productInfo.find((i) => i.label === "Type")?.value ?? p.unit },
    { label: "Ingredients", get: (p) => p.ingredients.slice(0, 3).join(", ") },
    { label: "Reference price", get: (p) => formatPeso(p.price) },
    { label: "Pack", get: (p) => p.unit },
    { label: "Availability", get: (p) => <StockBadge status={p.stockStatus} /> },
  ];
  return (
    <div className="w-full overflow-hidden rounded-xl border bg-card text-xs">
      <table className="w-full">
        <caption className="sr-only">Comparison of {a.name} and {b.name}</caption>
        <thead>
          <tr className="border-b bg-muted/60">
            <th scope="col" className="w-24 p-2 text-left font-medium text-muted-foreground" />
            <th scope="col" className="p-2 text-left font-semibold">{a.name}</th>
            <th scope="col" className="p-2 text-left font-semibold">{b.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b last:border-b-0">
              <th scope="row" className="p-2 text-left align-top font-medium text-muted-foreground">
                {r.label}
              </th>
              <td className="p-2 align-top">{r.get(a)}</td>
              <td className="p-2 align-top">{r.get(b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadForm({ active }: { active: boolean }) {
  const { submitLead, state } = useChat();
  const [name, setName] = React.useState(state.name ?? "");
  const [mobile, setMobile] = React.useState(state.mobile ?? "");
  const [channel, setChannel] = React.useState<ContactChannel>("sms");
  const [errors, setErrors] = React.useState<{ name?: string; mobile?: string }>({});
  const [submitting, setSubmitting] = React.useState(false);
  const formId = React.useId();

  if (state.leadCaptured) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-xs font-medium text-success">
        <CheckCircle2 className="size-4" aria-hidden />
        Contact details sent to the seller
      </p>
    );
  }
  if (!active) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Please enter your name.";
    if (!isValidPHMobile(mobile)) next.mobile = "Use a PH mobile number, e.g. 0917 123 4567.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      await submitLead({ name: name.trim(), mobile: mobile.trim(), preferredChannel: channel });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid w-full gap-2.5 rounded-xl border bg-card p-3" aria-label="Share your contact details">
      <p className="text-xs font-medium">Share your details so the seller can confirm your order</p>
      <div className="grid gap-1">
        <label htmlFor={`${formId}-name`} className="text-xs text-muted-foreground">Name</label>
        <Input id={`${formId}-name`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="h-9" aria-invalid={errors.name ? true : undefined} />
        {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
      </div>
      <div className="grid gap-1">
        <label htmlFor={`${formId}-mobile`} className="text-xs text-muted-foreground">Mobile number</label>
        <Input id={`${formId}-mobile`} value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" className="h-9" aria-invalid={errors.mobile ? true : undefined} />
        {errors.mobile && <p className="text-[11px] text-destructive">{errors.mobile}</p>}
      </div>
      <div className="grid gap-1">
        <label htmlFor={`${formId}-channel`} className="text-xs text-muted-foreground">Preferred contact</label>
        <NativeSelect id={`${formId}-channel`} value={channel} onChange={(e) => setChannel(e.target.value as ContactChannel)} className="h-9">
          <option value="sms">SMS / Text</option>
          <option value="mobile">Phone call</option>
          <option value="messenger">Messenger</option>
          <option value="viber">Viber</option>
        </NativeSelect>
      </div>
      <Button type="submit" size="sm" loading={submitting}>
        Send to seller
      </Button>
      <p className="text-[10px] leading-snug text-muted-foreground">
        Used only to respond to your inquiry. See our{" "}
        <Link href="/privacy" className="underline">privacy policy</Link>.
      </p>
    </form>
  );
}

function OrderLink({ productSlug, quantity }: { productSlug?: string; quantity?: number }) {
  const { state, closeChat, products } = useChat();
  const product = products.find((p) => p.slug === productSlug);
  const params = new URLSearchParams({ source: "chat" });
  if (productSlug) params.set("product", productSlug);
  if (quantity) params.set("qty", String(quantity));
  if (state.location) params.set("location", state.location);
  if (state.name) params.set("name", state.name);
  if (state.mobile) params.set("mobile", state.mobile);
  return (
    <Link
      href={`/order-inquiry?${params.toString()}`}
      onClick={() => closeChat()}
      className="group flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft/60 p-3 transition-colors hover:bg-primary-soft"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <ClipboardList className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">Send order inquiry</span>
        <span className="block truncate text-xs text-muted-foreground">
          {product ? `${quantity ? `${quantity} × ` : ""}${product.name}` : "Details pre-filled from this chat"}
        </span>
      </span>
      <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function HandoffNotice() {
  return (
    <p className={cn("flex items-center gap-2 rounded-xl bg-coffee-soft px-3 py-2 text-xs text-coffee")}>
      <Store className="size-4 shrink-0" aria-hidden />
      The seller has been notified and will reply personally.
    </p>
  );
}
