import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/mock-data/site";
import { SocialIcon } from "@/components/layout/brand";
import { Container, PageHero } from "@/components/layout/page-primitives";
import { ContactForm } from "@/components/site/contact-form";
import { AskAIButton } from "@/components/chat/ask-ai-button";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with the seller by phone, Messenger, or email." };

export default function ContactPage() {
  const { contact, socials, deliveryAreas } = siteConfig;
  const items = [
    { icon: Phone, label: "Mobile / Viber", value: contact.mobile },
    { icon: Mail, label: "Email", value: contact.email },
    { icon: MapPin, label: "Location", value: contact.address },
    { icon: Clock, label: "Store hours", value: contact.hours },
  ];
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Message the seller directly, or get instant answers from the AI assistant anytime."
      >
        <div className="pt-2">
          <AskAIButton variant="outline">Ask the AI Assistant</AskAIButton>
        </div>
      </PageHero>
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-8">
          <ul className="grid gap-4">
            {items.map((i) => (
              <li key={i.label} className="flex gap-4 rounded-2xl border bg-card p-4 shadow-soft">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-foreground">
                  <i.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{i.label}</p>
                  <p className="font-medium">{i.value}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <h2 className="font-semibold">Find us on</h2>
            <div className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.platform}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                >
                  <SocialIcon platform={s.platform} /> {s.label}
                </a>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="font-semibold">Delivery areas</h2>
            <p className="text-sm text-muted-foreground">{deliveryAreas.join(" · ")}. Provincial orders ship by courier.</p>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-medium">Send a message</h2>
          <ContactForm />
        </div>
      </Container>
    </>
  );
}
