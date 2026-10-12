"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardList, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "@/types";
import { cn, formatPeso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsListLine, TabsTriggerLine } from "@/components/ui/tabs";
import { StockBadge } from "@/components/shared/status-badges";
import { AskAIButton } from "@/components/chat/ask-ai-button";
import { ProductImage } from "./product-image";
import { QuantitySelector } from "./quantity-selector";

export function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = React.useState(0);
  const shots = product.images?.length
    ? product.images.map((src, i) => ({ src, tone: product.tone, angle: (i % 3) as 0 | 1 | 2 }))
    : product.gallery.map((tone, i) => ({ src: undefined, tone, angle: (i % 3) as 0 | 1 | 2 }));
  const current = shots[index] ?? shots[0];
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border shadow-soft">
        <ProductImage src={current.src} visual={product.visual} tone={current.tone} angle={current.angle} name={product.name} priority />
      </div>
      <div className="grid grid-cols-4 gap-3" role="tablist" aria-label="Product photos">
        {shots.map((s, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Photo ${i + 1} of ${shots.length}`}
            onClick={() => setIndex(i)}
            className={cn(
              "overflow-hidden rounded-xl border-2 transition-colors",
              i === index ? "border-primary" : "border-transparent opacity-80 hover:opacity-100",
            )}
          >
            <ProductImage src={s.src} visual={product.visual} tone={s.tone} angle={s.angle} name={product.name} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductPurchasePanel({ product, categoryName }: { product: Product; categoryName: string }) {
  const [quantity, setQuantity] = React.useState(1);
  const unavailable = product.stockStatus === "out_of_stock";
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href={`/categories/${product.category}`} className="text-xs font-semibold tracking-[0.14em] text-leaf uppercase hover:underline">
          {categoryName}
        </Link>
        <h1 className="font-display text-3xl font-medium tracking-tight text-balance sm:text-4xl">{product.name}</h1>
        <p className="text-lg text-pretty text-muted-foreground">{product.summary}</p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border bg-card p-5 shadow-soft">
        <div>
          <p className="text-3xl font-semibold tracking-tight">{formatPeso(product.price)}</p>
          <p className="text-sm text-muted-foreground">{product.unit} · reference price</p>
        </div>
        <StockBadge status={product.stockStatus} className="text-sm" />
      </div>

      <div className="space-y-3">
        <label htmlFor="qty" className="text-sm font-medium">
          Quantity
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <QuantitySelector id="qty" value={quantity} onChange={setQuantity} />
          <Button size="lg" className="flex-1" asChild>
            <Link href={`/order-inquiry?product=${product.slug}&qty=${quantity}`}>
              <ClipboardList aria-hidden /> {unavailable ? "Inquire about restock" : "Send Order Inquiry"}
            </Link>
          </Button>
        </div>
        <AskAIButton productSlug={product.slug} variant="soft" size="lg" className="w-full">
          Ask AI About This Product
        </AskAIButton>
        <p className="text-xs text-muted-foreground">
          This is an inquiry, not a checkout. The seller will confirm availability, total amount, payment, and delivery.
        </p>
      </div>

      <ul className="grid gap-3 border-t pt-5 text-sm sm:grid-cols-2">
        <li className="flex items-start gap-2">
          <Truck className="mt-0.5 size-4 shrink-0 text-leaf" aria-hidden />
          Delivery in Metro Manila, Rizal & Bulacan; courier for provinces
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf" aria-hidden />
          Every order personally confirmed by the seller
        </li>
      </ul>
    </div>
  );
}

export function ProductInfoSections({ product }: { product: Product }) {
  const sections: { id: string; title: string; content: React.ReactNode }[] = [
    { id: "description", title: "Description", content: <p className="leading-relaxed">{product.description}</p> },
    {
      id: "ingredients",
      title: "Ingredients",
      content: (
        <div className="space-y-3">
          <ul className="flex flex-wrap gap-2">
            {product.ingredients.map((i) => (
              <li key={i} className="rounded-full bg-muted px-3 py-1 text-sm">
                {i}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">Based on the approved product label. Always check the packaging for allergens.</p>
        </div>
      ),
    },
    { id: "usage", title: "Preparation / Usage", content: <p className="leading-relaxed">{product.preparation}</p> },
    {
      id: "info",
      title: "Product Information",
      content: (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {product.productInfo.map((row) => (
            <div key={row.label} className="border-b pb-2">
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: "shipping",
      title: "Shipping / Availability",
      content: (
        <div className="space-y-3">
          <StockBadge status={product.stockStatus} />
          <p className="leading-relaxed">{product.shippingInfo}</p>
        </div>
      ),
    },
    {
      id: "faqs",
      title: "FAQs",
      content: (
        <Accordion type="single" collapsible>
          {product.faqs.map((f) => (
            <AccordionItem key={f.question} value={f.question}>
              <AccordionTrigger>{f.question}</AccordionTrigger>
              <AccordionContent>{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ),
    },
    {
      id: "important",
      title: "Important Information",
      content: <p className="rounded-xl border border-warning/20 bg-warning-soft/60 p-4 text-sm leading-relaxed">{product.importantInfo}</p>,
    },
  ];

  return (
    <>
      <Accordion type="multiple" defaultValue={["description"]} className="rounded-2xl border bg-card px-5 md:hidden">
        {sections.map((s) => (
          <AccordionItem key={s.id} value={s.id}>
            <AccordionTrigger>{s.title}</AccordionTrigger>
            <AccordionContent className="text-foreground">{s.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Tabs defaultValue="description" className="hidden md:block">
        <TabsListLine>
          {sections.map((s) => (
            <TabsTriggerLine key={s.id} value={s.id}>
              {s.title}
            </TabsTriggerLine>
          ))}
        </TabsListLine>
        {sections.map((s) => (
          <TabsContent key={s.id} value={s.id} className="max-w-3xl pt-6 text-[15px]">
            {s.content}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
