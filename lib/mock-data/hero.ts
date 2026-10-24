import type { HeroSlide } from "@/types";

/**
 * Homepage hero slides. Clips live in /public/videos (sources and licence in
 * /public/videos/CREDITS.md). Copy follows the compliance rules: no health claims.
 */
export const heroSlides: HeroSlide[] = [
  {
    id: "coffee",
    label: "Coffee",
    eyebrow: "Coffee & beverages",
    title: "Your daily cup,",
    highlight: "made simple.",
    description: "Black, 3-in-1, Classic, or mushroom blends. Find the DXN coffee that fits the way you start your morning.",
    video: "/videos/hero-coffee.mp4",
    poster: "/videos/hero-coffee.jpg",
    primary: { label: "Shop coffee", href: "/categories/coffee" },
    secondary: { label: "Help me choose", aiPrompt: "Recommend a coffee" },
  },
  {
    id: "wellness",
    label: "Wellness",
    eyebrow: "Everyday wellness",
    title: "Small rituals.",
    highlight: "A better everyday.",
    description: "Zhi Mint candies, Himalayan salt, and pantry-friendly extras, with clear label information and honest answers to your questions.",
    video: "/videos/hero-wellness.mp4",
    poster: "/videos/hero-wellness.jpg",
    primary: { label: "Explore wellness", href: "/categories/wellness" },
    secondary: { label: "Ask the AI assistant", aiPrompt: "Tell me about Himalayan Salt" },
  },
  {
    id: "care",
    label: "Personal care",
    eyebrow: "Personal care",
    title: "Gentle care,",
    highlight: "start to finish.",
    description: "Soap, toothpaste, and daily essentials that round out your routine, delivered with your usual order.",
    video: "/videos/hero-care.mp4",
    poster: "/videos/hero-care.jpg",
    primary: { label: "Shop personal care", href: "/categories/personal-care" },
    secondary: { label: "Send an order inquiry", href: "/order-inquiry" },
  },
];
