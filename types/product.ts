export type ProductCategorySlug =
  | "coffee"
  | "beverages"
  | "supplements"
  | "personal-care"
  | "wellness";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "pre_order";

export type ProductVisual = "coffee" | "tea" | "capsule" | "powder" | "bottle" | "soap" | "jar";

/** Earthy colour families used by the product image placeholders. */
export type ProductTone = "coffee" | "cream" | "leaf" | "clay" | "sage" | "forest";

export interface ProductCategory {
  slug: ProductCategorySlug;
  name: string;
  shortName: string;
  description: string;
  tone: ProductTone;
  visual: ProductVisual;
  /** Lifestyle photo for category cards. */
  image?: string;
}

export interface ProductFAQ {
  question: string;
  answer: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategorySlug;
  /** Reference price in PHP. Final amount is always confirmed by the seller. */
  price: number;
  unit: string;
  stockStatus: StockStatus;
  stockQuantity: number;
  summary: string;
  description: string;
  ingredients: string[];
  preparation: string;
  productInfo: { label: string; value: string }[];
  shippingInfo: string;
  faqs: ProductFAQ[];
  importantInfo: string;
  tags: string[];
  /** Alternative names customers commonly type (used by the mock AI). */
  aliases: string[];
  visual: ProductVisual;
  tone: ProductTone;
  gallery: ProductTone[];
  /** Real product photos (first is the primary). Falls back to the illustrated placeholder when empty. */
  images?: string[];
  isBestSeller: boolean;
  /** Seller-controlled: whether the AI may use this product's information. */
  approvedForAI: boolean;
  archived: boolean;
  typicalReorderDays?: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export type ProductSort = "featured" | "name_asc" | "price_asc" | "price_desc" | "newest";

export interface ProductQuery {
  search?: string;
  category?: ProductCategorySlug | "all";
  availability?: "all" | "available";
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  includeArchived?: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
