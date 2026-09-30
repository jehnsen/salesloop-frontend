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
  Truck,
  Zap,
} from "lucide-react";
import type { BlogPost, Product, Testimonial } from "@/types";
import { categories, featuredCategoryGroups } from "@/lib/mock-data/categories";
import { Button } from "@/components/ui/button";
import { AskAIButton } from "@/components/chat/ask-ai-button";
import { Container, SectionHeader } from "@/components/layout/page-primitives";
import { BlogCard, CategoryCard, TestimonialCard } from "./cards";
import { ProductGrid } from "./product-card";
import { ProductImage } from "./product-image";

export function HomeHero({ featured }: { featured: Product[] }) {
  const [a, b, c] = featured;
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-cream/70 via-background to-background" aria-hidden />
      <Container className="grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div className="space-y-7">
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <span className="size-1.5 rounded-full bg-leaf" aria-hidden /> Independent reseller · Metro Manila, Rizal & Bulacan
          </p>
          <h1 className="font-display text-[2.6rem] leading-[1.05] font-medium tracking-tight text-balance sm:text-6xl">
            Everyday Wellness Products, Made Easier to Discover
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            Explore coffee, beverages, and personal-care favorites. Have a question? Our AI assistant answers anytime,
            and your order is always confirmed personally by the seller.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/products">
                Explore Products <ArrowRight aria-hidden />
              </Link>
            </Button>
            <AskAIButton size="lg" variant="outline">
              Ask Our AI Assistant
            </AskAIButton>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-leaf" aria-hidden /> Seller-confirmed orders</li>
            <li className="flex items-center gap-1.5"><Truck className="size-4 text-leaf" aria-hidden /> Local delivery</li>
            <li className="flex items-center gap-1.5"><Repeat className="size-4 text-leaf" aria-hidden /> Easy reorders</li>
          </ul>
        </div>

        {a && b && c && (
          <div
            className="relative mx-auto grid h-[340px] w-full max-w-lg grid-cols-5 grid-rows-5 gap-3 sm:h-[460px] sm:gap-4"
            aria-label="Featured products"
          >
            <Link href={`/products/${a.slug}`} className="col-span-3 row-span-5 overflow-hidden rounded-3xl shadow-lift">
              <ProductImage visual={a.visual} tone={a.tone} name={a.name} angle={1} className="aspect-auto h-full" priority />
            </Link>
            <Link href={`/products/${b.slug}`} className="col-span-2 row-span-3 overflow-hidden rounded-3xl shadow-soft">
              <ProductImage visual={b.visual} tone={b.tone} name={b.name} className="aspect-auto h-full" />
            </Link>
            <Link href={`/products/${c.slug}`} className="col-span-2 row-span-2 overflow-hidden rounded-3xl shadow-soft">
              <ProductImage visual={c.visual} tone={c.tone} name={c.name} angle={2} className="aspect-auto h-full" />
            </Link>
            <div className="absolute -bottom-5 -left-2 max-w-[250px] animate-fade-up rounded-2xl border bg-card p-3 shadow-lift sm:-left-8">
              <p className="text-xs text-muted-foreground">Customer asked</p>
              <p className="text-sm font-medium">“Which coffee is less sweet?”</p>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-accent-foreground">
                <MessageCircleQuestion className="mt-px size-3.5 shrink-0" aria-hidden />
                AI suggested Lingzhi Black Coffee, with no added sugar.
              </p>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

export function FeaturedCategories() {
  return (
    <section className="py-16">
      <Container className="space-y-8">
        <SectionHeader
          eyebrow="Shop by category"
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
    <section className="py-16">
      <Container className="space-y-8">
        <SectionHeader
          eyebrow="Customer favorites"
          title="Best sellers"
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
  { icon: MapPin, title: "Convenient local ordering", text: "Delivery around Metro Manila, Rizal, and Bulacan, or pick-up in Pasig." },
  { icon: Zap, title: "Fast inquiries", text: "The AI assistant answers instantly. The seller confirms within store hours." },
  { icon: Repeat, title: "Repeat-order assistance", text: "Just say “same order” and we'll prepare your usual." },
];

export function WhyShopWithUs() {
  return (
    <section className="py-16">
      <Container>
        <div className="rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-10 lg:px-14">
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
            <li key={s.title} className="relative rounded-2xl border bg-card p-5 shadow-soft">
              <span className="absolute top-4 right-4 font-display text-3xl text-muted-foreground/30" aria-hidden>
                {i + 1}
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
        <div className="relative overflow-hidden rounded-3xl border bg-cream px-6 py-14 text-center sm:px-12">
          <div className="absolute -top-16 -right-16 size-56 rounded-full bg-sage/30 blur-2xl" aria-hidden />
          <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-clay/20 blur-2xl" aria-hidden />
          <div className="relative mx-auto max-w-xl space-y-5">
            <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Not sure what to choose?</h2>
            <p className="text-lg text-muted-foreground">
              Tell the assistant how you like your coffee or what you&apos;re looking for, and it will point you to the right product.
            </p>
            <AskAIButton size="lg">Ask the AI Assistant</AskAIButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
