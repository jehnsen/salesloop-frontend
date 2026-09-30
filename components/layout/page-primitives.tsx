import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl space-y-2", align === "center" && "mx-auto")}>
        {eyebrow && <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-leaf uppercase sm:text-xs">{eyebrow}</p>}
        <Heading className="font-display text-3xl leading-tight font-normal tracking-[-0.035em] text-balance sm:text-[2.65rem]">{title}</Heading>
        {description && <p className="text-base text-pretty text-muted-foreground sm:text-lg">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Simple page intro used by content pages (about, faq, legal, blog). */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b bg-surface", className)}>
      <Container className="py-14 sm:py-20">
        <div className="max-w-3xl space-y-3">
          {eyebrow && <p className="text-xs font-semibold tracking-[0.14em] text-leaf uppercase">{eyebrow}</p>}
          <h1 className="font-display text-4xl font-normal tracking-[-0.035em] text-balance sm:text-6xl">{title}</h1>
          {description && <p className="text-lg text-pretty text-muted-foreground">{description}</p>}
          {children}
        </div>
      </Container>
    </section>
  );
}
