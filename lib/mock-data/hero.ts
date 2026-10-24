import type { HeroSlide } from "@/types";

/**
 * Homepage hero banners. Each image carries its own headline and button, so the alt text
 * repeats what it says. Files live in /public/images/hero. Copy follows the compliance
 * rules: no health claims.
 */
export const heroSlides: HeroSlide[] = [
  {
    id: "everyday",
    label: "Everyday wellness",
    image: "/images/hero/everyday.webp",
    alt: "Small rituals. A better everyday. Coffee, beverages, personal care and wellness products for a healthier, more balanced life. Explore products.",
    href: "/products",
    focus: { mobile: "0% 50%", desktop: "50% 30%" },
  },
  {
    id: "ingredients",
    label: "Himalayan salt & Zhi Mint",
    image: "/images/hero/ingredients.webp",
    alt: "Pure ingredients, everyday care. Himalayan salt and Zhi Mint candies for a fresher, healthier you.",
    href: "/categories/wellness",
    focus: { mobile: "0% 50%", desktop: "50% 50%" },
  },
  {
    id: "coffee",
    label: "Lingzhi Coffee 3-in-1",
    image: "/images/hero/coffee.webp",
    alt: "Make every cup count. Enjoy the rich coffee ritual with DXN Lingzhi Coffee 3-in-1. Discover Lingzhi Coffee.",
    href: "/products/lingzhi-coffee-3-in-1",
    focus: { mobile: "15% 50%", desktop: "50% 58%" },
  },
];
