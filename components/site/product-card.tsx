import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/types";
import { categories } from "@/lib/mock-data/categories";
import { cn, formatPeso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StockBadge } from "@/components/shared/status-badges";
import { AskAIButton } from "@/components/chat/ask-ai-button";
import { ProductImage } from "./product-image";

export function ProductCard({ product, className, priority }: { product: Product; className?: string; priority?: boolean }) {
  const category = categories.find((c) => c.slug === product.category);
  return (
    <article className={cn("group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-2 shadow-soft transition-[box-shadow,border-color] duration-300 hover:border-primary/25 hover:shadow-lift", className)}>
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden rounded-xl" tabIndex={-1} aria-hidden>
        <ProductImage
          visual={product.visual}
          tone={product.tone}
          name={product.name}
          priority={priority}
          className="aspect-[6/5] transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {product.isBestSeller && (
          <span className="absolute top-3 left-3 rounded-full border border-white/30 bg-forest px-3 py-1.5 text-[10px] font-medium tracking-wide text-white shadow-sm">
            Best seller
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-3 pt-5 sm:p-4">
        <div className="space-y-1">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-leaf uppercase">{category?.shortName}</p>
          <h3 className="font-display text-xl leading-snug font-medium">
            <Link href={`/products/${product.slug}`} className="hover:text-primary focus-visible:underline">
              {product.name}
            </Link>
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.summary}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">{formatPeso(product.price)}</p>
            <p className="text-[11px] text-muted-foreground">Reference price</p>
          </div>
          <StockBadge status={product.stockStatus} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/products/${product.slug}`}>
              View <ArrowRight aria-hidden />
            </Link>
          </Button>
          <AskAIButton productSlug={product.slug} variant="soft" size="sm" aria-label={`Ask AI about ${product.name}`}>
            Ask AI
          </AskAIButton>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Skeleton className="h-8 rounded-full" />
          <Skeleton className="h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
