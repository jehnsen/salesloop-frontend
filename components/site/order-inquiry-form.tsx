"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardList, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ContactChannel, Order, Product } from "@/types";
import { createOrderInquiry, ValidationError } from "@/services/orders";
import { formatPeso, isValidEmail, isValidPHMobile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/misc";
import { FormField } from "@/components/shared/form-field";
import { StockBadge } from "@/components/shared/status-badges";
import { ProductImage } from "./product-image";
import { QuantitySelector } from "./quantity-selector";

export interface OrderInquiryDefaults {
  productSlug?: string;
  quantity?: number;
  location?: string;
  fullName?: string;
  mobile?: string;
  fromChat?: boolean;
}

type FormState = {
  fullName: string;
  mobile: string;
  messengerName: string;
  email: string;
  productSlug: string;
  quantity: number;
  location: string;
  preferredContact: ContactChannel;
  notes: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const CONTACT_OPTIONS: { id: ContactChannel; label: string }[] = [
  { id: "sms", label: "SMS / Text" },
  { id: "mobile", label: "Phone call" },
  { id: "messenger", label: "Messenger" },
  { id: "viber", label: "Viber" },
  { id: "email", label: "Email" },
];

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (f.fullName.trim().length < 2) e.fullName = "Please enter your full name.";
  if (!isValidPHMobile(f.mobile)) e.mobile = "Enter a PH mobile number, e.g. 0917 123 4567.";
  if (f.email && !isValidEmail(f.email)) e.email = "Please enter a valid email address.";
  if (!f.productSlug) e.productSlug = "Please choose a product.";
  if (!(f.quantity >= 1)) e.quantity = "Quantity must be at least 1.";
  if (!f.location.trim()) e.location = "Please enter your city or municipality.";
  if (f.preferredContact === "messenger" && !f.messengerName.trim()) e.messengerName = "Add your Messenger name so we can find you.";
  if (f.preferredContact === "email" && !f.email.trim()) e.email = "Add your email so we can reply.";
  return e;
}

export function OrderInquiryForm({ products, defaults }: { products: Product[]; defaults: OrderInquiryDefaults }) {
  const [form, setForm] = React.useState<FormState>({
    fullName: defaults.fullName ?? "",
    mobile: defaults.mobile ?? "",
    messengerName: "",
    email: "",
    productSlug: defaults.productSlug ?? "",
    quantity: defaults.quantity ?? 1,
    location: defaults.location ?? "",
    preferredContact: "sms",
    notes: "",
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState<Order | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const product = products.find((p) => p.slug === form.productSlug);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus();
      toast.error("Please check the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrderInquiry({
        ...form,
        messengerName: form.messengerName || undefined,
        email: form.email || undefined,
        notes: form.notes || undefined,
        aiAssisted: defaults.fromChat,
      });
      setSubmitted(order);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors(err.fields as Errors);
        toast.error(err.message);
      } else {
        toast.error("We couldn't send your inquiry. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border bg-card p-8 text-center shadow-soft" role="status">
        <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden />
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-medium">Inquiry sent. Salamat!</h2>
          <p className="text-muted-foreground">
            Your inquiry has been sent. The seller will confirm availability, total amount, payment, and delivery details.
          </p>
        </div>
        <dl className="grid gap-2 rounded-2xl bg-muted/60 p-4 text-left text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Reference</dt><dd className="font-semibold">{submitted.reference}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Product</dt><dd className="text-right">{submitted.items[0].quantity} × {submitted.items[0].productName}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Reference total</dt><dd>{formatPeso(submitted.total)} + delivery</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Deliver to</dt><dd>{submitted.deliveryLocation}</dd></div>
        </dl>
        <p className="text-sm text-muted-foreground">We usually reply within a few hours during store hours (Mon–Sat, 8 AM – 8 PM).</p>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild><Link href="/products">Continue browsing</Link></Button>
          <Button variant="outline" onClick={() => { setSubmitted(null); setForm((f) => ({ ...f, notes: "" })); }}>
            Send another inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-8">
        {defaults.fromChat && (
          <p className="flex items-center gap-2 rounded-xl bg-primary-soft px-4 py-3 text-sm text-accent-foreground">
            <Sparkles className="size-4 shrink-0" aria-hidden /> Details pre-filled from your AI assistant chat. Please review before sending.
          </p>
        )}
        <fieldset className="grid gap-5 rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
          <legend className="float-left mb-1 text-lg font-semibold">Your details</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="fullName" label="Full name" error={errors.fullName} className="sm:col-span-2">
              {(p) => <Input {...p} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" />}
            </FormField>
            <FormField id="mobile" label="Mobile number" error={errors.mobile} hint="We'll use this to confirm your order.">
              {(p) => <Input {...p} value={form.mobile} onChange={(e) => set("mobile", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" />}
            </FormField>
            <FormField id="email" label="Email" optional error={errors.email}>
              {(p) => <Input {...p} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />}
            </FormField>
            <FormField id="messengerName" label="Messenger / Facebook name" optional error={errors.messengerName}>
              {(p) => <Input {...p} value={form.messengerName} onChange={(e) => set("messengerName", e.target.value)} />}
            </FormField>
            <FormField id="location" label="City / municipality" error={errors.location} hint="e.g. Quezon City, Antipolo, Malolos">
              {(p) => <Input {...p} value={form.location} onChange={(e) => set("location", e.target.value)} autoComplete="address-level2" />}
            </FormField>
          </div>
          <div className="grid gap-2">
            <p id="contact-label" className="text-sm font-medium">Preferred contact method</p>
            <RadioGroup
              aria-labelledby="contact-label"
              value={form.preferredContact}
              onValueChange={(v) => set("preferredContact", v as ContactChannel)}
              className="flex flex-wrap gap-2"
            >
              {CONTACT_OPTIONS.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-2 rounded-full border bg-background px-3.5 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-soft"
                >
                  <RadioGroupItem value={o.id} />
                  {o.label}
                </label>
              ))}
            </RadioGroup>
          </div>
        </fieldset>

        <fieldset className="grid gap-5 rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
          <legend className="float-left mb-1 text-lg font-semibold">What would you like?</legend>
          <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
            <FormField id="productSlug" label="Product" error={errors.productSlug}>
              {(p) => (
                <NativeSelect {...p} value={form.productSlug} onChange={(e) => set("productSlug", e.target.value)}>
                  <option value="">Choose a product…</option>
                  {products.map((prod) => (
                    <option key={prod.slug} value={prod.slug}>
                      {prod.name} ({formatPeso(prod.price)})
                    </option>
                  ))}
                </NativeSelect>
              )}
            </FormField>
            <div className="grid gap-1.5">
              <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
              <QuantitySelector id="quantity" value={form.quantity} onChange={(q) => set("quantity", q)} className="justify-self-start" />
            </div>
          </div>
          <FormField id="notes" label="Notes" optional hint="Preferred delivery day, landmark, or questions for the seller.">
            {(p) => <Textarea {...p} value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={500} />}
          </FormField>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ClipboardList className="size-5 text-leaf" aria-hidden /> Order summary
          </h2>
          {product ? (
            <div className="flex gap-4">
              <div className="w-20 shrink-0 overflow-hidden rounded-xl border">
                <ProductImage visual={product.visual} tone={product.tone} name={product.name} />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.unit}</p>
                <StockBadge status={product.stockStatus} />
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Choose a product to see your summary.</p>
          )}
          <dl className="grid gap-2 border-t pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Unit price</dt><dd>{product ? formatPeso(product.price) : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Quantity</dt><dd>{form.quantity}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>Confirmed by seller</dd></div>
            <div className="flex justify-between border-t pt-3 text-base font-semibold">
              <dt>Reference total</dt>
              <dd>{product ? formatPeso(product.price * form.quantity) : "—"}</dd>
            </div>
          </dl>
          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            Send Inquiry
          </Button>
          <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            No payment is taken now. The seller will confirm availability, total amount, payment, and delivery details. By sending,
            you agree to our <Link href="/privacy" className="underline">privacy policy</Link>.
          </p>
        </div>
      </aside>
    </form>
  );
}
