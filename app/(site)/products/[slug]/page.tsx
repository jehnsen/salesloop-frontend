import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircleQuestion } from "lucide-react";
import { products } from "@/lib/mock-data/products";
import { getCategoryBySlug, getProductBySlug, getRelatedProducts } from "@/services/products";
import { AskAIButton } from "@/components/chat/ask-ai-button";
import { Breadcrumbs, Container, SectionHeader } from "@/components/layout/page-primitives";
import { ProductGrid } from "@/components/site/product-card";
import { ProductGallery, ProductInfoSections, ProductPurchasePanel } from "@/components/site/product-detail";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  return product ? { title: product.name, description: product.summary } : { title: "Product not found" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [category, related] = await Promise.all([getCategoryBySlug(product.category), getRelatedProducts(slug, 4)]);

  return (
    <>
      <Container className="space-y-8 py-8 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: category?.name ?? "Category", href: `/categories/${product.category}` },
            { label: product.name },
          ]}
        />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <ProductGallery product={product} />
          <ProductPurchasePanel product={product} categoryName={category?.name ?? ""} />
        </div>
      </Container>

      <Container className="py-8">
        <ProductInfoSections product={product} />
      </Container>

      <Container className="py-10">
        <div className="flex flex-col items-start gap-5 rounded-3xl border bg-primary-soft/50 p-6 sm:flex-row sm:items-center sm:p-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <MessageCircleQuestion className="size-6" aria-hidden />
          </span>
          <div className="flex-1 space-y-1">
            <h2 className="font-display text-2xl font-medium">Ask AI about {product.name}</h2>
            <p className="text-muted-foreground">
              Compare it with similar products, check availability, or ask how to prepare it. The assistant already knows which
              product you&apos;re looking at.
            </p>
          </div>
          <AskAIButton productSlug={product.slug} size="lg">
            Ask about this product
          </AskAIButton>
        </div>
      </Container>

      {related.length > 0 && (
        <Container className="space-y-8 py-10">
          <SectionHeader title="Customers also viewed" />
          <ProductGrid products={related} />
        </Container>
      )}
    </>
  );
}
