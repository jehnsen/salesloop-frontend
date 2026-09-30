import type { Metadata } from "next";
import Link from "next/link";
import { BadgeInfo, HandHeart, MessageCircle, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/lib/mock-data/site";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { Container, PageHero, SectionHeader } from "@/components/layout/page-primitives";
import { ProductImage } from "@/components/site/product-image";

export const metadata: Metadata = { title: "About", description: "Meet the independent seller behind Luntian Wellness." };

const VALUES = [
  { icon: HandHeart, title: "Personal service", text: "Every order is confirmed by a real person who knows the products." },
  { icon: ShieldCheck, title: "Honest information", text: "We share label information only. No medical claims, no pressure." },
  { icon: MessageCircle, title: "Always reachable", text: "Chat with the AI assistant anytime, or message the seller during store hours." },
];

export default function AboutPage() {
  const { seller, disclaimers } = siteConfig;
  return (
    <>
      <PageHero eyebrow="About" title="A neighborhood seller, now a little easier to reach" description={siteConfig.tagline} />
      <Container className="grid items-center gap-10 py-14 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="overflow-hidden rounded-3xl shadow-soft">
            <ProductImage visual="coffee" tone="coffee" name="Lingzhi Coffee" angle={1} />
          </div>
          <div className="mt-10 overflow-hidden rounded-3xl shadow-soft">
            <ProductImage visual="soap" tone="cream" name="Ganozhi Soap" angle={1} />
          </div>
        </div>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar name={seller.name} className="size-14 text-base" />
            <div>
              <p className="text-lg font-semibold">{seller.name}</p>
              <p className="text-sm text-muted-foreground">{seller.role}</p>
            </div>
          </div>
          <p className="text-lg leading-relaxed">{seller.bio}</p>
          <p className="leading-relaxed text-muted-foreground">
            Luntian Wellness started as a small Messenger-based store for friends and neighbors. This website makes it easier
            to browse products, get quick answers from our AI assistant, and send an order inquiry. You still get the same
            personal service: every order is confirmed by me.
          </p>
          <Button asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </Container>
      <Container className="space-y-8 py-10">
        <SectionHeader title="What we care about" />
        <ul className="grid gap-4 md:grid-cols-3">
          {VALUES.map((v) => (
            <li key={v.title} className="rounded-2xl border bg-card p-6 shadow-soft">
              <v.icon className="size-6 text-leaf" aria-hidden />
              <h3 className="mt-4 font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.text}</p>
            </li>
          ))}
        </ul>
      </Container>
      <Container className="py-10">
        <div className="flex gap-4 rounded-2xl border bg-cream/60 p-6">
          <BadgeInfo className="mt-0.5 size-5 shrink-0 text-coffee" aria-hidden />
          <div className="space-y-2 text-sm leading-relaxed">
            <p className="font-semibold">Independent distributor notice</p>
            <p className="text-muted-foreground">{disclaimers.independentSeller}</p>
            <p className="text-muted-foreground">Distributor ID: {seller.distributorId}</p>
          </div>
        </div>
      </Container>
    </>
  );
}
