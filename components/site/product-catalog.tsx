"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { PackageSearch, SlidersHorizontal } from "lucide-react";
import type { Paginated, Product, ProductCategorySlug, ProductQuery, ProductSort } from "@/types";
import { categories } from "@/lib/mock-data/categories";
import { getProducts } from "@/services/products";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FilterChips } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { AskAIButton } from "@/components/chat/ask-ai-button";
import { ProductGrid, ProductGridSkeleton } from "./product-card";

const SORTS: { id: ProductSort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "name_asc", label: "Name (A–Z)" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
  { id: "newest", label: "Newest" },
];

const CATEGORY_OPTIONS: { id: ProductCategorySlug | "all"; label: string }[] = [
  { id: "all", label: "All" },
  ...categories.map((c) => ({ id: c.slug, label: c.slug === "wellness" ? "Other Wellness" : c.shortName })),
];

const PAGE_SIZE = 8;

type Filters = Required<Pick<ProductQuery, "search" | "category" | "availability" | "sort">>;

function useDebounced<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function ProductCatalog({
  initial,
  initialFilters,
  lockedCategory,
}: {
  initial: Paginated<Product>;
  initialFilters: Filters;
  /** On category pages the category filter is fixed and hidden. */
  lockedCategory?: ProductCategorySlug;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = React.useState<Filters>(initialFilters);
  const [searchText, setSearchText] = React.useState(initialFilters.search);
  const search = useDebounced(searchText);
  const [page, setPage] = React.useState(1);
  const [result, setResult] = React.useState(initial);
  const [status, setStatus] = React.useState<"idle" | "loading" | "loading-more" | "error">("idle");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const firstRun = React.useRef(true);

  const effective = React.useMemo(
    () => ({ ...filters, search, category: lockedCategory ?? filters.category }),
    [filters, search, lockedCategory],
  );

  const load = React.useCallback(
    async (targetPage: number) => {
      setStatus(targetPage === 1 ? "loading" : "loading-more");
      try {
        const data = await getProducts({ ...effective, page: targetPage, pageSize: PAGE_SIZE });
        setResult(data);
        setPage(targetPage);
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    },
    [effective],
  );

  // Refetch when filters change, and mirror them into the URL so views are shareable.
  React.useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    void load(1);
    const params = new URLSearchParams();
    if (effective.search) params.set("q", effective.search);
    if (!lockedCategory && effective.category !== "all") params.set("category", effective.category);
    if (effective.availability === "available") params.set("available", "1");
    if (effective.sort !== "featured") params.set("sort", effective.sort);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [effective, load, lockedCategory, pathname, router]);

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const activeCount =
    (effective.category !== "all" && !lockedCategory ? 1 : 0) + (effective.availability === "available" ? 1 : 0);

  const filterControls = (
    <div className="grid gap-6">
      {!lockedCategory && (
        <fieldset className="grid gap-3">
          <legend className="mb-2 text-sm font-medium">Category</legend>
          <FilterChips
            label="Category"
            options={CATEGORY_OPTIONS}
            value={filters.category}
            onChange={(category) => update({ category })}
            className="flex-wrap"
          />
        </fieldset>
      )}
      <label className="flex items-center justify-between gap-4 text-sm font-medium">
        Available only
        <Switch
          checked={filters.availability === "available"}
          onCheckedChange={(on) => update({ availability: on ? "available" : "all" })}
          aria-label="Show available products only"
        />
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          value={searchText}
          onChange={setSearchText}
          placeholder="Search coffee, soap, spirulina…"
          label="Search products"
          className="md:max-w-sm md:flex-1"
        />
        <div className="flex items-center gap-2 md:ml-auto">
          <Button variant="outline" className="md:hidden" onClick={() => setDrawerOpen(true)}>
            <SlidersHorizontal aria-hidden /> Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>
            )}
          </Button>
          <label className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <Switch
              checked={filters.availability === "available"}
              onCheckedChange={(on) => update({ availability: on ? "available" : "all" })}
            />
            Available only
          </label>
          <label htmlFor="sort" className="sr-only">
            Sort products
          </label>
          <NativeSelect
            id="sort"
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as ProductSort })}
            wrapperClassName="flex-1 md:w-52 md:flex-none"
            className="rounded-full"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {!lockedCategory && (
        <FilterChips
          label="Category"
          options={CATEGORY_OPTIONS}
          value={filters.category}
          onChange={(category) => update({ category })}
          className="hidden md:flex"
        />
      )}

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {status === "loading" ? "Loading products…" : `${result.total} product${result.total === 1 ? "" : "s"}`}
        {effective.search && status !== "loading" ? ` for “${effective.search}”` : ""}
      </p>

      {status === "error" ? (
        <ErrorState
          description="We couldn't load products right now."
          action={<Button variant="outline" onClick={() => load(1)}>Try again</Button>}
        />
      ) : status === "loading" ? (
        <ProductGridSkeleton count={4} />
      ) : result.items.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No products match your filters"
          description="Try a different search, or ask the AI assistant to help you find the right product."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchText("");
                  setFilters({ search: "", category: "all", availability: "all", sort: "featured" });
                }}
              >
                Clear filters
              </Button>
              <AskAIButton prompt={effective.search ? `Do you have ${effective.search}?` : undefined}>Ask AI</AskAIButton>
            </div>
          }
        />
      ) : (
        <>
          <ProductGrid products={result.items} />
          {result.hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="lg" onClick={() => load(page + 1)} loading={status === "loading-more"}>
                Load more products
              </Button>
            </div>
          )}
        </>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="bottom" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>Filter products</SheetTitle>
          </SheetHeader>
          <SheetBody>{filterControls}</SheetBody>
          <SheetFooter>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => update({ category: "all", availability: "all" })}
            >
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setDrawerOpen(false)}>
              Show {result.total} results
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
