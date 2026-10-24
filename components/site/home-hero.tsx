import { Leaf, MessageCircleQuestion, ShieldCheck, Truck } from "lucide-react";
import type { HeroSlide } from "@/types";
import { Container } from "@/components/layout/page-primitives";
import { HeroCarousel } from "./hero-carousel";

const ASSURANCES = [
  { icon: Leaf, label: "Everyday essentials" },
  { icon: ShieldCheck, label: "Seller-confirmed orders" },
  { icon: Truck, label: "Convenient local delivery" },
  { icon: MessageCircleQuestion, label: "Personal help, always" },
];

/** Homepage hero: the banner carousel plus the assurance strip beneath it. */
export function HomeHero({ slides }: { slides: HeroSlide[] }) {
  return (
    <>
      <HeroCarousel slides={slides} />
      <div className="bg-forest text-white">
        <Container>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-5 py-5 text-xs text-white/80 sm:grid-cols-4 sm:text-sm">
            {ASSURANCES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center justify-center gap-2.5">
                <Icon className="size-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </>
  );
}
