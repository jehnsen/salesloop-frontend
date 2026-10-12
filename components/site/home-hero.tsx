import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, HandHeart, Leaf, MessageCircleQuestion, ShieldCheck, Sparkles, Truck } from "lucide-react";
import type { Product } from "@/types";
import { formatPeso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AskAIButton } from "@/components/chat/ask-ai-button";
import { Container } from "@/components/layout/page-primitives";
import { HeroMotion } from "./hero-motion";
import { ProductImage } from "./product-image";

/** Stagger helper: sets the --d delay read by the .hero-* animation classes in globals.css. */
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
/** Parallax strength for a .hero-depth layer. Negative values move against the pointer. */
const depth = (px: number) => ({ "--depth": `${px}px` }) as CSSProperties;

/** Gold motes drifting up behind the content: left, size, duration, delay, sideways sway. */
const MOTES = [
  { x: "8%", size: "3px", duration: "10s", delay: "0s", sway: "18px" },
  { x: "27%", size: "5px", duration: "13s", delay: "3.5s", sway: "-22px" },
  { x: "46%", size: "3px", duration: "11s", delay: "6s", sway: "12px" },
  { x: "63%", size: "4px", duration: "14s", delay: "1.5s", sway: "-16px" },
  { x: "81%", size: "3px", duration: "9s", delay: "4.5s", sway: "20px" },
  { x: "93%", size: "5px", duration: "12s", delay: "7.5s", sway: "-12px" },
];

const ASSURANCES = [
  { icon: Leaf, label: "Everyday DXN essentials" },
  { icon: ShieldCheck, label: "Seller-confirmed orders" },
  { icon: Truck, label: "Convenient local delivery" },
  { icon: MessageCircleQuestion, label: "Personal help, always" },
];

export function HomeHero({ featured }: { featured: Product[] }) {
  const [a] = featured;
  return (
    <HeroMotion className="botanical-hero relative overflow-hidden text-primary-foreground">
      <div className="hero-ambient" aria-hidden>
        <span className="hero-depth absolute inset-0" style={depth(-26)}>
          <span className="hero-glow hero-glow-a" />
          <span className="hero-glow hero-glow-b" />
        </span>
        {MOTES.map((m) => (
          <span
            key={m.x}
            className="hero-mote"
            style={{ "--x": m.x, "--s": m.size, "--t": m.duration, "--d": m.delay, "--sway": m.sway } as CSSProperties}
          />
        ))}
      </div>

      <Container className="relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="relative z-10">
          <p className="hero-rise mb-7 inline-flex items-center gap-2.5 text-[10px] font-medium tracking-[0.22em] text-sage uppercase sm:text-xs">
            <span className="hero-rule h-px w-7 bg-gold" style={delay(250)} aria-hidden /> Small rituals. Everyday wellness.
          </p>
          <h1 className="max-w-xl font-display text-[clamp(2.9rem,5.5vw,5.2rem)] leading-[1.04] font-normal tracking-[-0.045em]">
            <span className="hero-line">
              <span style={delay(120)}>A little care.</span>
            </span>
            <span className="hero-line">
              <span style={delay(260)}>
                A better <span className="hero-shimmer font-light italic">everyday.</span>
              </span>
            </span>
          </h1>
          <p className="hero-rise mt-7 max-w-md text-base leading-relaxed text-white/75 sm:text-lg" style={delay(480)}>
            From your first cup of coffee to your daily essentials, discover DXN favorites that fit naturally into your routine.
          </p>
          <div className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row" style={delay(620)}>
            <Button
              size="lg"
              variant="gold"
              asChild
              className="hero-cta [&_svg]:transition-transform [&_svg]:duration-300 hover:[&_svg]:translate-x-0.5 hover:[&_svg]:-translate-y-0.5"
            >
              <Link href="/products">
                Discover the collection <ArrowUpRight aria-hidden />
              </Link>
            </Button>
            <AskAIButton
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:border-white/50 hover:bg-white/10 [&_svg]:transition-transform [&_svg]:duration-500 hover:[&_svg]:scale-110 hover:[&_svg]:rotate-12"
            >
              Find my favorites
            </AskAIButton>
          </div>
          <div className="hero-rise mt-10 flex items-center gap-3 border-t border-white/15 pt-6" style={delay(780)}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-sage/30 text-sage">
              <HandHeart className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <div className="text-xs leading-relaxed">
              <p className="font-medium text-white">Thoughtfully chosen. Personally assisted.</p>
              <p className="mt-0.5 text-white/65">Independent reseller · Metro Manila, Rizal & Bulacan</p>
            </div>
          </div>
        </div>

        {a && (
          <div className="relative mx-auto w-full max-w-lg pb-5" aria-label="Featured collection">
            <span className="hero-depth absolute inset-0 hidden sm:block" style={depth(-14)} aria-hidden>
              {/* Spin only: stacking an entrance fade on this ring stopped it painting in Chromium. */}
              <span className="hero-orbit">
                <span />
              </span>
            </span>

            <div className="hero-depth relative" style={depth(8)}>
              <Link
                href={`/products/${a.slug}`}
                className="hero-arch hero-studio group relative block overflow-hidden rounded-t-[46%] rounded-b-3xl text-forest"
                style={delay(200)}
              >
                <div className="relative z-10 pt-10 text-center sm:pt-12">
                  <Leaf className="hero-rise mx-auto mb-2 size-5" style={delay(700)} strokeWidth={1.3} aria-hidden />
                  <p className="hero-rise text-[10px] font-medium tracking-[0.24em] uppercase" style={delay(780)}>
                    The everyday collection
                  </p>
                  <p className="hero-rise mt-2 font-display text-2xl italic sm:text-3xl" style={delay(880)}>
                    Your moment of calm.
                  </p>
                </div>
                {/* mix-blend-multiply sits on the outer layer: transforms further in would isolate the blend. */}
                <div className="hero-depth relative mix-blend-multiply" style={depth(10)}>
                  <span className="hero-shadow" aria-hidden />
                  <div className="hero-float">
                    <ProductImage
                      src={a.images?.[0]}
                      visual={a.visual}
                      tone={a.tone}
                      name={a.name}
                      angle={1}
                      className="mx-auto -mt-2 w-[85%] max-w-[320px] bg-transparent [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-105 [&_svg]:transition-transform [&_svg]:duration-700 group-hover:[&_svg]:scale-105"
                      transparent
                      priority
                    />
                  </div>
                </div>
                <div
                  className="hero-rise relative z-10 mx-6 mb-6 flex items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur-sm sm:mx-8"
                  style={delay(1000)}
                >
                  <div>
                    <p className="text-[10px] tracking-[0.12em] text-coffee uppercase">A daily favorite</p>
                    <p className="mt-1 text-sm font-semibold">{a.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatPeso(a.price)} · Reference price</p>
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest text-white transition-transform duration-300 group-hover:scale-110">
                    <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </span>
                </div>
              </Link>
            </div>

            <div className="hero-depth absolute -right-2 bottom-0 z-20 sm:-right-4" style={depth(20)}>
              <div className="hero-pop flex items-center gap-2.5 rounded-full border bg-card py-3 pr-5 pl-3 text-foreground shadow-lift" style={delay(1250)}>
                <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Sparkles className="hero-twinkle size-4" aria-hidden />
                </span>
                <p className="text-xs font-medium">
                  A little guidance, anytime.
                  <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">Meet your AI product assistant</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </Container>

      <div className="relative border-t border-white/15">
        <Container>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-5 py-5 text-xs text-white/80 sm:grid-cols-4 sm:text-sm">
            {ASSURANCES.map(({ icon: Icon, label }, i) => (
              <li key={label} className="hero-rise flex items-center justify-center gap-2.5" style={delay(950 + i * 90)}>
                <Icon className="size-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </HeroMotion>
  );
}
