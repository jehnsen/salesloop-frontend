import type { ProductCategory, ProductCategorySlug } from "@/types";

export const categories: ProductCategory[] = [
  {
    slug: "coffee",
    name: "Coffee",
    shortName: "Coffee",
    description: "Black, 3-in-1, and white coffee blends for your daily cup.",
    tone: "coffee",
    visual: "coffee",
  },
  {
    slug: "beverages",
    name: "Beverages",
    shortName: "Beverages",
    description: "Cocoa, tea, and fruit drinks for any time of day.",
    tone: "clay",
    visual: "tea",
  },
  {
    slug: "supplements",
    name: "Food Supplements",
    shortName: "Supplements",
    description: "Capsules and tablets. Not a replacement for medication.",
    tone: "sage",
    visual: "capsule",
  },
  {
    slug: "personal-care",
    name: "Personal Care",
    shortName: "Personal Care",
    description: "Soap, toothpaste, and everyday care essentials.",
    tone: "cream",
    visual: "soap",
  },
  {
    slug: "wellness",
    name: "Other Wellness Products",
    shortName: "Wellness",
    description: "Cereals, honey drinks, and pantry-friendly extras.",
    tone: "leaf",
    visual: "jar",
  },
];

/** Homepage grouping. "Coffee & Beverages" opens the coffee category, which links to beverages. */
export const featuredCategoryGroups: {
  title: string;
  description: string;
  slug: ProductCategorySlug;
}[] = [
  { title: "Coffee & Beverages", description: "Your daily cup, cocoa, and tea drinks.", slug: "coffee" },
  { title: "Food Supplements", description: "Capsules and tablets for your routine.", slug: "supplements" },
  { title: "Personal Care", description: "Soap, toothpaste, and hair care.", slug: "personal-care" },
  { title: "Wellness Products", description: "Cereals, honey drinks, and more.", slug: "wellness" },
];
