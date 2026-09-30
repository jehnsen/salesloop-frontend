import type { Metadata } from "next";
import type { ProductCategorySlug, ProductSort } from "@/types";
import { categories } from "@/lib/mock-data/categories";
import { getProducts } from "@/services/products";
import { Container, PageHero } from "@/components/layout/page-primitives";
import { ProductCatalog } from "@/components/site/product-catalog";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse coffee, beverages, food supplements, and personal-care products. Ask the AI assistant or send an order inquiry.",
};

const SORTS: ProductSort[] = ["featured", "name_asc", "price_asc", "price_desc", "newest"];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const str = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const categoryParam = str("category");
  const sortParam = str("sort") as ProductSort | undefined;

  const filters = {
    search: str("q") ?? "",
    category: categories.some((c) => c.slug === categoryParam) ? (categoryParam as ProductCategorySlug) : ("all" as const),
    availability: str("available") === "1" ? ("available" as const) : ("all" as const),
    sort: sortParam && SORTS.includes(sortParam) ? sortParam : ("featured" as const),
  };
  const initial = await getProducts({ ...filters, page: 1, pageSize: 8 });

  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="All products"
        description="Reference prices shown. The seller confirms final amounts, availability, and delivery after you send an inquiry."
      />
      <Container className="py-10">
        <ProductCatalog initial={initial} initialFilters={filters} />
      </Container>
    </>
  );
}
