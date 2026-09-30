"use client";

import * as React from "react";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { Product, ProductCategorySlug, ProductFAQ, ProductInput, StockStatus } from "@/types";
import { categories } from "@/lib/mock-data/categories";
import { STOCK_LABEL } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/shared/form-field";

type Errors = Partial<Record<"name" | "price" | "unit" | "summary" | "description" | "stockQuantity", string>>;

function blankProduct(): ProductInput {
  const category = categories[0];
  return {
    slug: "",
    name: "",
    category: category.slug,
    price: 0,
    unit: "",
    stockStatus: "in_stock",
    stockQuantity: 0,
    summary: "",
    description: "",
    ingredients: [],
    preparation: "",
    productInfo: [],
    shippingInfo:
      "Delivery is available within Metro Manila, Rizal, and Bulacan. The seller confirms stock, delivery fee, and schedule after you send an inquiry.",
    faqs: [],
    importantInfo: "",
    tags: [],
    aliases: [],
    visual: category.visual,
    tone: category.tone,
    gallery: [category.tone, "cream", "sage"],
    isBestSeller: false,
    approvedForAI: false,
    archived: false,
  };
}

/** Words that must never appear in approved product copy (compliance helper). */
const BLOCKED_CLAIMS = /\b(cure[sd]?|treat(s|ment)?|prevent(s)?|heal(s)?|guarantee[sd]?|gamot|lunas|pampagaling)\b/i;

export function ProductForm({
  product,
  onSubmit,
  onCancel,
}: {
  product?: Product;
  onSubmit: (input: ProductInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [v, setV] = React.useState<ProductInput>(() => (product ? { ...product } : blankProduct()));
  const [ingredientsText, setIngredientsText] = React.useState((product?.ingredients ?? []).join("\n"));
  const [aliasesText, setAliasesText] = React.useState((product?.aliases ?? []).join(", "));
  const [errors, setErrors] = React.useState<Errors>({});
  const [saving, setSaving] = React.useState(false);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setV((p) => ({ ...p, [key]: value }));
  const setFaq = (i: number, patch: Partial<ProductFAQ>) => set("faqs", v.faqs.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  // Ignore negated sentences such as "not intended to ... cure", which are required disclaimers.
  const withoutNegations = (t: string) => t.split(/(?<=[.!?])\s+/).filter((s) => !/\b(not|never|no|hindi|walang)\b/i.test(s)).join(" ");
  const claimWarning = [v.summary, v.description, v.importantInfo, ...v.faqs.map((f) => f.answer)].some((t) =>
    BLOCKED_CLAIMS.test(withoutNegations(t)),
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (v.name.trim().length < 2) next.name = "Product name is required.";
    if (!(v.price > 0)) next.price = "Enter a price greater than 0.";
    if (!v.unit.trim()) next.unit = "Describe the pack size, e.g. Box of 20 sachets.";
    if (v.summary.trim().length < 10) next.summary = "Write a short summary (at least 10 characters).";
    if (v.description.trim().length < 20) next.description = "Add a description (at least 20 characters).";
    if (v.stockQuantity < 0) next.stockQuantity = "Stock can't be negative.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const category = categories.find((c) => c.slug === v.category)!;
      await onSubmit({
        ...v,
        slug: product?.slug ?? slugify(v.name),
        name: v.name.trim(),
        ingredients: ingredientsText.split(/\n|,/).map((s) => s.trim()).filter(Boolean),
        aliases: aliasesText.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
        faqs: v.faqs.filter((f) => f.question.trim() && f.answer.trim()),
        visual: product ? v.visual : category.visual,
        tone: product ? v.tone : category.tone,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <fieldset className="grid gap-4">
          <legend className="mb-2 text-sm font-semibold">Basics</legend>
          <FormField id="p-name" label="Product name" error={errors.name}>
            {(p) => <Input {...p} value={v.name} onChange={(e) => set("name", e.target.value)} />}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="p-category" label="Category">
              {(p) => (
                <NativeSelect {...p} value={v.category} onChange={(e) => set("category", e.target.value as ProductCategorySlug)}>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </NativeSelect>
              )}
            </FormField>
            <FormField id="p-price" label="Reference price (₱)" error={errors.price}>
              {(p) => <Input {...p} type="number" inputMode="decimal" min={0} value={v.price || ""} onChange={(e) => set("price", Number(e.target.value))} />}
            </FormField>
            <FormField id="p-unit" label="Pack size / unit" error={errors.unit}>
              {(p) => <Input {...p} value={v.unit} onChange={(e) => set("unit", e.target.value)} placeholder="Box of 20 sachets (21g each)" />}
            </FormField>
            <FormField id="p-stock" label="Stock availability">
              {(p) => (
                <NativeSelect {...p} value={v.stockStatus} onChange={(e) => set("stockStatus", e.target.value as StockStatus)}>
                  {Object.entries(STOCK_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </NativeSelect>
              )}
            </FormField>
            <FormField id="p-qty" label="Units on hand" error={errors.stockQuantity} hint="Internal only. The AI never quotes exact stock.">
              {(p) => <Input {...p} type="number" min={0} value={v.stockQuantity} onChange={(e) => set("stockQuantity", Number(e.target.value))} />}
            </FormField>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Show as best seller</span>
            <Switch checked={v.isBestSeller} onCheckedChange={(c) => set("isBestSeller", c)} />
          </label>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="mb-2 text-sm font-semibold">Approved product information</legend>
          <FormField id="p-summary" label="Short summary" error={errors.summary}>
            {(p) => <Textarea {...p} value={v.summary} onChange={(e) => set("summary", e.target.value)} className="min-h-16" />}
          </FormField>
          <FormField id="p-desc" label="Description" error={errors.description}>
            {(p) => <Textarea {...p} value={v.description} onChange={(e) => set("description", e.target.value)} />}
          </FormField>
          <FormField id="p-ingredients" label="Ingredients" hint="One per line, as printed on the label.">
            {(p) => <Textarea {...p} value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} className="min-h-20" />}
          </FormField>
          <FormField id="p-prep" label="Preparation / usage">
            {(p) => <Textarea {...p} value={v.preparation} onChange={(e) => set("preparation", e.target.value)} className="min-h-16" />}
          </FormField>
          <FormField id="p-important" label="Important information / disclaimer" hint="Food supplements should include the “No approved therapeutic claims” notice.">
            {(p) => <Textarea {...p} value={v.importantInfo} onChange={(e) => set("importantInfo", e.target.value)} className="min-h-16" />}
          </FormField>
          <FormField id="p-aliases" label="Names customers use" optional hint="Comma-separated. Helps the AI recognise the product, e.g. lingzhi, 3in1.">
            {(p) => <Input {...p} value={aliasesText} onChange={(e) => setAliasesText(e.target.value)} />}
          </FormField>
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="mb-2 text-sm font-semibold">FAQs</legend>
          {v.faqs.map((f, i) => (
            <div key={i} className="grid gap-2 rounded-xl border p-3">
              <div className="flex items-center gap-2">
                <label htmlFor={`faq-q-${i}`} className="sr-only">Question {i + 1}</label>
                <Input id={`faq-q-${i}`} value={f.question} onChange={(e) => setFaq(i, { question: e.target.value })} placeholder="Question" />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => set("faqs", v.faqs.filter((_, j) => j !== i))} aria-label={`Remove FAQ ${i + 1}`}>
                  <Trash2 />
                </Button>
              </div>
              <label htmlFor={`faq-a-${i}`} className="sr-only">Answer {i + 1}</label>
              <Textarea id={`faq-a-${i}`} value={f.answer} onChange={(e) => setFaq(i, { answer: e.target.value })} placeholder="Answer" className="min-h-16" />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => set("faqs", [...v.faqs, { question: "", answer: "" }])}>
            <Plus aria-hidden /> Add FAQ
          </Button>
        </fieldset>

        <div className="rounded-xl border border-primary/20 bg-primary-soft/40 p-4">
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold"><ShieldCheck className="size-4 text-leaf" aria-hidden /> Approved for AI Responses</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                When on, the AI assistant may use this product&apos;s approved information (summary, ingredients, preparation, FAQs, price, stock status) to answer customers.
              </span>
            </span>
            <Switch checked={v.approvedForAI} onCheckedChange={(c) => set("approvedForAI", c)} aria-label="Approved for AI responses" />
          </label>
          {claimWarning && (
            <p role="alert" className="mt-3 rounded-lg bg-warning-soft p-2.5 text-xs text-warning">
              This copy contains words like “cure”, “treat”, or “prevent”. Remove health claims before approving it for AI or publishing it.
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 border-t p-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={saving}>{product ? "Save changes" : "Create product"}</Button>
      </div>
    </form>
  );
}
