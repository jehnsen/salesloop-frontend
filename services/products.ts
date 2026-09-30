import type { Paginated, Product, ProductCategory, ProductInput, ProductQuery } from "@/types";
import { categories } from "@/lib/mock-data/categories";
import { createId, slugify } from "@/lib/utils";
import { must, mutate, nowIso, query } from "./_mock";

const STOCK_ORDER: Record<Product["stockStatus"], number> = {
  in_stock: 0,
  low_stock: 1,
  pre_order: 2,
  out_of_stock: 3,
};

function applyQuery(all: Product[], q: ProductQuery): Paginated<Product> {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 12;
  const search = q.search?.trim().toLowerCase();

  let items = all.filter((p) => q.includeArchived || !p.archived);
  if (q.category && q.category !== "all") items = items.filter((p) => p.category === q.category);
  if (q.availability === "available") items = items.filter((p) => p.stockStatus !== "out_of_stock");
  if (search) {
    items = items.filter((p) =>
      [p.name, p.summary, ...p.tags, ...p.aliases].some((field) => field.toLowerCase().includes(search)),
    );
  }

  switch (q.sort ?? "featured") {
    case "name_asc":
      items.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "price_asc":
      items.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      items.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    default:
      items.sort(
        (a, b) =>
          Number(b.isBestSeller) - Number(a.isBestSeller) || STOCK_ORDER[a.stockStatus] - STOCK_ORDER[b.stockStatus],
      );
  }

  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(0, start + pageSize), total, page, pageSize, hasMore: start + pageSize < total };
}

export function getProducts(q: ProductQuery = {}) {
  return query((db) => applyQuery(db.products, q));
}

export function getAllProducts(options: { includeArchived?: boolean } = {}) {
  return query((db) => db.products.filter((p) => options.includeArchived || !p.archived));
}

export function getProductBySlug(slug: string) {
  return query((db) => db.products.find((p) => p.slug === slug && !p.archived) ?? null);
}

export function getBestSellers(limit = 6) {
  return query((db) => db.products.filter((p) => p.isBestSeller && !p.archived).slice(0, limit));
}

export function getRelatedProducts(slug: string, limit = 4) {
  return query((db) => {
    const current = db.products.find((p) => p.slug === slug);
    if (!current) return [];
    const others = db.products.filter((p) => p.slug !== slug && !p.archived);
    const sameCategory = others.filter((p) => p.category === current.category);
    const rest = others.filter((p) => p.category !== current.category && p.isBestSeller);
    return [...sameCategory, ...rest].slice(0, limit);
  });
}

export function getProductsBySlugs(slugs: string[]) {
  return query((db) => slugs.map((s) => db.products.find((p) => p.slug === s)).filter((p): p is Product => Boolean(p)));
}

export async function getCategories(): Promise<ProductCategory[]> {
  return structuredClone(categories);
}

export async function getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
  return structuredClone(categories.find((c) => c.slug === slug) ?? null);
}

// --- Admin -----------------------------------------------------------------

export function createProduct(input: ProductInput) {
  return mutate((db) => {
    const baseSlug = input.slug || slugify(input.name);
    let slug = baseSlug;
    let n = 2;
    while (db.products.some((p) => p.slug === slug)) slug = `${baseSlug}-${n++}`;
    const product: Product = { ...input, slug, id: createId("prd"), createdAt: nowIso(), updatedAt: nowIso() };
    db.products.unshift(product);
    return product;
  });
}

export function updateProduct(id: string, patch: Partial<ProductInput>) {
  return mutate((db) => {
    const product = must(db.products.find((p) => p.id === id), "Product", id);
    Object.assign(product, patch, { updatedAt: nowIso() });
    return product;
  });
}

export function setProductArchived(id: string, archived: boolean) {
  return updateProduct(id, { archived });
}

export function setProductAIApproval(id: string, approvedForAI: boolean) {
  return updateProduct(id, { approvedForAI });
}
