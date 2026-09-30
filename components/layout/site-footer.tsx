import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { categories } from "@/lib/mock-data/categories";
import { siteConfig } from "@/lib/mock-data/site";
import { Container } from "./page-primitives";
import { Logo, SocialIcon } from "./brand";

const COLUMNS = [
  {
    title: "Shop",
    links: [{ href: "/products", label: "All products" }, ...categories.map((c) => ({ href: `/categories/${c.slug}`, label: c.name }))],
  },
  {
    title: "Help",
    links: [
      { href: "/order-inquiry", label: "Order inquiry" },
      { href: "/ai-assistant", label: "AI assistant" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "About the seller" },
      { href: "/blog", label: "Learn" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function SiteFooter() {
  const { contact, seller, socials, disclaimers } = siteConfig;
  return (
    <footer className="site-footer mt-16 border-t">
      <Container className="grid gap-10 py-14 lg:grid-cols-[1.4fr_2fr]">
        <div className="space-y-5">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">{siteConfig.tagline}</p>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="size-4" aria-hidden /> {contact.mobile}</li>
            <li className="flex items-center gap-2"><Mail className="size-4" aria-hidden /> {contact.email}</li>
            <li className="flex items-center gap-2"><MapPin className="size-4" aria-hidden /> {contact.address}</li>
            <li className="flex items-center gap-2"><Clock className="size-4" aria-hidden /> {contact.hours}</li>
          </ul>
          <ul className="flex gap-2" aria-label="Social media">
            {socials.map((s) => (
              <li key={s.platform}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <SocialIcon platform={s.platform} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="mb-3 text-sm font-semibold">{col.title}</p>
              <ul className="grid gap-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>
      <div className="border-t">
        <Container className="grid gap-3 py-6 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong className="font-medium text-foreground">Seller:</strong> {seller.name}, {seller.role} · Distributor ID {seller.distributorId}
          </p>
          <p>{disclaimers.independentSeller}</p>
          <p>{disclaimers.health}</p>
          <p>© {new Date().getFullYear()} {siteConfig.storeName}. Prices are reference prices and are confirmed by the seller.</p>
        </Container>
      </div>
    </footer>
  );
}
