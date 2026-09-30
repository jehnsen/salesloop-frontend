"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ClipboardList, Menu, Sparkles } from "lucide-react";
import { categories } from "@/lib/mock-data/categories";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useChat } from "@/components/chat/chat-provider";
import { Container } from "./page-primitives";
import { Logo } from "./brand";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/blog", label: "Learn" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { openChat } = useChat();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => setMobileOpen(false), [pathname]);

  const linkClass = (active: boolean) =>
    cn(
      "rounded-full px-3 py-2 text-sm font-medium transition-colors",
      active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-200",
        scrolled ? "border-border bg-background/90 shadow-soft backdrop-blur-md" : "border-transparent bg-background",
      )}
    >
      <Container className="flex h-16 items-center gap-4">
        <Logo />
        <nav aria-label="Main" className="ml-6 hidden items-center gap-0.5 lg:flex">
          {NAV.slice(0, 2).map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(isActive(pathname, item.href))} aria-current={isActive(pathname, item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(linkClass(pathname.startsWith("/categories")), "inline-flex items-center gap-1 data-[state=open]:text-foreground")}>
              Categories <ChevronDown className="size-3.5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {categories.map((c) => (
                <DropdownMenuItem key={c.slug} asChild>
                  <Link href={`/categories/${c.slug}`} className="flex flex-col items-start gap-0.5">
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.description}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {NAV.slice(2).map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(isActive(pathname, item.href))} aria-current={isActive(pathname, item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/order-inquiry">
              <ClipboardList aria-hidden /> Order inquiry
            </Link>
          </Button>
          <Button size="sm" onClick={() => openChat()} className="hidden sm:inline-flex">
            <Sparkles aria-hidden /> Ask AI
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </div>
      </Container>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle asChild>
              <div>
                <Logo />
              </div>
            </SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-6">
            <nav aria-label="Mobile" className="grid gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-base font-medium",
                    isActive(pathname, item.href) ? "bg-primary-soft text-accent-foreground" : "hover:bg-muted",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div>
              <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Categories</p>
              <div className="grid gap-1">
                {categories.map((c) => (
                  <Link key={c.slug} href={`/categories/${c.slug}`} className="rounded-lg px-3 py-2 text-sm hover:bg-muted">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </SheetBody>
          <SheetFooter className="flex-col">
            <Button
              onClick={() => {
                setMobileOpen(false);
                openChat();
              }}
            >
              <Sparkles aria-hidden /> Ask our AI Assistant
            </Button>
            <Button variant="outline" asChild>
              <Link href="/order-inquiry">
                <ClipboardList aria-hidden /> Send order inquiry
              </Link>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </header>
  );
}
