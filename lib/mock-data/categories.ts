import type { ProductCategory, ProductCategorySlug } from "@/types";

export const categories: ProductCategory[] = [
  {
    slug: "coffee",
    name: "Coffee",
    shortName: "Coffee",
    description: "Black, 3-in-1, and white coffee blends for your daily cup.",
    tone: "coffee",
    visual: "coffee",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=75",
  },
  {
    slug: "beverages",
    name: "Beverages",
    shortName: "Beverages",
    description: "Cocoa, tea, and fruit drinks for any time of day.",
    tone: "clay",
    visual: "tea",
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=75",
  },
  {
    slug: "supplements",
    name: "Food Supplements",
    shortName: "Supplements",
    description: "Capsules and tablets. Not a replacement for medication.",
    tone: "sage",
    visual: "capsule",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=75",
  },
  {
    slug: "personal-care",
    name: "Personal Care",
    shortName: "Personal Care",
    description: "Soap, toothpaste, and everyday care essentials.",
    tone: "cream",
    visual: "soap",
    image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=900&q=75",
  },
  {
    slug: "wellness",
    name: "Other Wellness Products",
    shortName: "Wellness",
    description: "Cereals, honey drinks, and pantry-friendly extras.",
    tone: "leaf",
    visual: "jar",
    image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=900&q=75",
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
