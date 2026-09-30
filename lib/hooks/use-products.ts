"use client";

import * as React from "react";
import type { Product } from "@/types";
import { getAllProducts } from "@/services/products";

let cache: Product[] | null = null;
let inflight: Promise<Product[]> | null = null;

function load() {
  inflight ??= getAllProducts({ includeArchived: true }).then((list) => {
    cache = list;
    inflight = null;
    return list;
  });
  return inflight;
}

/** Product lookup for admin views (names, tones) with a shared in-memory cache. */
export function useProductLookup() {
  const [products, setProducts] = React.useState<Product[]>(cache ?? []);
  React.useEffect(() => {
    if (!cache) void load().then(setProducts);
    const refresh = () => {
      cache = null;
      void load().then(setProducts);
    };
    window.addEventListener("salesloop:db-change", refresh);
    return () => window.removeEventListener("salesloop:db-change", refresh);
  }, []);
  const bySlug = React.useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const name = React.useCallback((slug?: string) => (slug ? (bySlug.get(slug)?.name ?? slug) : "—"), [bySlug]);
  return { products, bySlug, name };
}
