import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories } from "@/lib/mock-data/categories";
import { siteConfig } from "@/lib/mock-data/site";
import { getCategoryBySlug, getProducts } from "@/services/products";
import { cn } from "@/lib/utils";
import { Breadcrumbs, Container } from "@/components/layout/page-primitives";
import { ProductCatalog } from "@/components/site/product-catalog";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  return category ? { title: category.name, description: category.description } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const filters = { search: "", category: category.slug, availability: "all" as const, sort: "featured" as const };
  const initial = await getProducts({ ...filters, page: 1, pageSize: 8 });

  return (
    <>
      <section className="border-b bg-gradient-to-b from-cream/60 to-background">
        <Container className="space-y-5 py-10 sm:py-14">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: category.name }]} />
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">{category.name}</h1>
            <p className="text-lg text-muted-foreground">{category.description}</p>
          </div>
          <nav aria-label="Other categories" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                aria-current={c.slug === category.slug ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  c.slug === category.slug ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {c.name}
              </Link>
            ))}
          </nav>
          {category.slug === "supplements" && (
            <p className="max-w-2xl rounded-xl border bg-card p-3 text-sm text-muted-foreground">{siteConfig.disclaimers.health}</p>
          )}
        </Container>
      </section>
      <Container className="py-10">
        <ProductCatalog initial={initial} initialFilters={filters} lockedCategory={category.slug} />
      </Container>
    </>
  );
}
