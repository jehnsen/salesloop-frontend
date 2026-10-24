import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  HandHeart,
  Info,
  MapPin,
  MessageCircleQuestion,
  PackageCheck,
  Repeat,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { BlogPost, Product, Testimonial } from "@/types";
import { categories, featuredCategoryGroups } from "@/lib/mock-data/categories";
import { Button } from "@/components/ui/button";
import { AskAIButton } from "@/components/chat/ask-ai-button";
import { Container, SectionHeader } from "@/components/layout/page-primitives";
import { BlogCard, CategoryCard, TestimonialCard } from "./cards";
import { ProductGrid } from "./product-card";

export function FeaturedCategories() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="space-y-8">
        <SectionHeader
          eyebrow="A little something for every day"
          title="Find what fits your routine"
          action={
            <Button variant="link" asChild>
              <Link href="/products">All products <ArrowRight aria-hidden /></Link>
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {featuredCategoryGroups.map((group) => {
            const category = categories.find((c) => c.slug === group.slug)!;
            return <CategoryCard key={group.slug} category={category} title={group.title} description={group.description} />;
          })}
        </div>
      </Container>
    </section>
  );
}

export function BestSellers({ products }: { products: Product[] }) {
  return (
    <section className="border-y bg-surface/70 py-16 sm:py-20">
      <Container className="space-y-8">
        <SectionHeader
          eyebrow="Customer favorites"
          title="Good things, worth repeating."
          description="The products our customers reorder most."
          action={
            <Button variant="outline" asChild>
              <Link href="/products">View all <ArrowRight aria-hidden /></Link>
            </Button>
          }
        />
        <ProductGrid products={products} className="xl:grid-cols-3" />
      </Container>
    </section>
  );
}

const REASONS = [
  { icon: HandHeart, title: "Personal assistance", text: "A real seller who knows the products and replies personally." },
  { icon: Info, title: "Clear product information", text: "Ingredients, preparation, and label details, with no exaggerated claims." },
  { icon: MapPin, title: "Convenient local ordering", text: "Delivery around Cagayan Valley and CAR, or pick-up in San Mateo, Isabela." },
  { icon: Zap, title: "Fast inquiries", text: "The AI assistant answers instantly. The seller confirms within store hours." },
  { icon: Repeat, title: "Repeat-order assistance", text: "Just say “same order” and we'll prepare your usual." },
];

export function WhyShopWithUs() {
  return (
    <section className="py-16">
      <Container>
        <div className="botanical-hero rounded-3xl px-6 py-12 text-primary-foreground sm:px-10 lg:px-14">
          <SectionHeader
            eyebrow="Why shop with us"
            title={<span className="text-primary-foreground">Friendly service, from question to delivery</span>}
            className="[&_p:first-child]:text-sage"
          />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {REASONS.map((r) => (
              <li key={r.title} className="space-y-2">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/10">
                  <r.icon className="size-5" aria-hidden />
                </span>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm text-primary-foreground/75">{r.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

const STEPS = [
  { icon: Search, title: "Browse products", text: "Explore the catalog or ask the AI assistant for suggestions." },
  { icon: MessageCircleQuestion, title: "Ask questions", text: "Prices, preparation, delivery: ask anything, anytime." },
  { icon: ClipboardList, title: "Send an order inquiry", text: "Tell us what you'd like and where to deliver." },
  { icon: ShieldCheck, title: "Seller confirms", text: "Availability, total amount, payment, and delivery are confirmed personally." },
  { icon: PackageCheck, title: "Receive your order", text: "Delivered to your door or ready for pick-up." },
];

export function HowOrderingWorks() {
  return (
    <section className="py-16">
      <Container className="space-y-10">
        <SectionHeader
          align="center"
          eyebrow="How ordering works"
          title="No checkout pressure. Just a simple inquiry."
          description="Every order is confirmed by the seller, so stock, pricing, and delivery are always accurate."
        />
        <ol className="grid gap-4 md:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border bg-card p-5 shadow-soft transition-colors hover:border-primary/30">
              <span className="absolute top-4 right-4 font-display text-3xl text-primary/25" aria-hidden>
                0{i + 1}
              </span>
              <s.icon className="size-6 text-leaf" aria-hidden />
              <h3 className="mt-4 font-semibold">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/order-inquiry">Send an order inquiry <ArrowRight aria-hidden /></Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className="py-16">
      <Container className="space-y-8">
        <SectionHeader eyebrow="Kind words" title="What customers say" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Sample feedback shown for demonstration. Replace with real, consented customer reviews before launch. Individual experiences vary.
        </p>
      </Container>
    </section>
  );
}

export function LatestArticles({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="py-16">
      <Container className="space-y-8">
        <SectionHeader
          eyebrow="Learn"
          title="Helpful guides"
          action={
            <Button variant="link" asChild>
              <Link href="/blog">All articles <ArrowRight aria-hidden /></Link>
            </Button>
          }
        />
        <div className="grid gap-5 md:grid-cols-3">
          {posts.map((p) => (
            <BlogCard key={p.slug} post={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="py-16">
      <Container>
        <div className="botanical-hero relative overflow-hidden rounded-3xl px-6 py-16 text-center text-white sm:px-12">
          <div className="absolute -top-16 -right-16 size-72 rounded-full border border-sage/20" aria-hidden />
          <div className="absolute -bottom-20 -left-10 size-72 rounded-full border border-sage/20" aria-hidden />
          <div className="relative mx-auto max-w-xl space-y-5">
            <p className="text-xs tracking-[0.2em] text-gold uppercase">Your next favorite starts here</p>
            <h2 className="font-display text-4xl font-normal tracking-tight sm:text-5xl">Let’s find your everyday.</h2>
            <p className="text-base leading-relaxed text-white/75">
              Tell the assistant how you like your coffee or what you&apos;re looking for, and it will point you to the right product.
            </p>
            <AskAIButton size="lg" variant="gold">Find my favorites</AskAIButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
