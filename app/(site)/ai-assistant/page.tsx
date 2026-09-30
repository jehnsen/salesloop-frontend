import type { Metadata } from "next";
import { Clock, HeartPulse, Languages, ShieldCheck, Store } from "lucide-react";
import { siteConfig } from "@/lib/mock-data/site";
import { Container } from "@/components/layout/page-primitives";
import { AssistantPageChat } from "@/components/chat/assistant-page-chat";

export const metadata: Metadata = {
  title: "AI Product Assistant",
  description: "Ask about products, prices, availability, and delivery anytime. The seller confirms every order personally.",
};

const POINTS = [
  { icon: Clock, title: "Available 24/7", text: "Get answers even outside store hours." },
  { icon: Languages, title: "English, Filipino, or Taglish", text: "Ask the way you normally would." },
  { icon: ShieldCheck, title: "Approved information only", text: "Answers come from the seller's approved product details. No invented prices or stock." },
  { icon: HeartPulse, title: "No medical advice", text: "Health questions are referred to a qualified healthcare professional." },
  { icon: Store, title: "A real seller behind it", text: `Say “talk to seller” anytime to reach ${siteConfig.seller.name}.` },
];

export default function AIAssistantPage() {
  return (
    <Container className="grid gap-8 py-6 sm:py-10 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
      <aside className="order-2 space-y-6 lg:order-1 lg:pt-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.14em] text-leaf uppercase">AI Sales Assistant</p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-balance">Ask us anything about our products</h1>
          <p className="text-lg text-muted-foreground">
            Get help choosing, comparing, and ordering. When you&apos;re ready, the assistant prepares an order inquiry for the
            seller to confirm.
          </p>
        </div>
        <ul className="grid gap-4">
          {POINTS.map((p) => (
            <li key={p.title} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-foreground">
                <p.icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="rounded-xl border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          {siteConfig.disclaimers.ai} {siteConfig.disclaimers.independentSeller}
        </p>
      </aside>
      <div className="order-1 lg:order-2">
        <AssistantPageChat />
      </div>
    </Container>
  );
}
