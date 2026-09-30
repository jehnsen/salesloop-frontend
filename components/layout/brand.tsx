import Link from "next/link";
import { Leaf } from "lucide-react";
import type { SocialLink } from "@/types";
import { cn } from "@/lib/utils";

export function Logo({ className, subtitle = true, href = "/" }: { className?: string; subtitle?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Luntian Wellness home">
      <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:rotate-[-8deg]">
        <Leaf className="size-[18px]" aria-hidden />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight">Luntian Wellness</span>
        {subtitle && <span className="mt-0.5 text-[11px] text-muted-foreground">Independent reseller</span>}
      </span>
    </Link>
  );
}

/** Brand glyphs as inline SVG (icon libraries are dropping brand marks). */
const PATHS: Record<SocialLink["platform"], string> = {
  facebook:
    "M13.5 21v-7.5h2.53l.38-2.94H13.5V8.69c0-.85.24-1.43 1.46-1.43h1.55V4.63A20.7 20.7 0 0 0 14.25 4.5c-2.24 0-3.77 1.37-3.77 3.88v2.18H7.95v2.94h2.53V21h3.02Z",
  instagram:
    "M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm4.8-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM12 3c-2.44 0-2.75.01-3.71.05-2.9.13-4.5 1.74-4.64 4.64C3.61 8.65 3.6 8.96 3.6 11.4v1.2c0 2.44.01 2.75.05 3.71.13 2.9 1.74 4.51 4.64 4.64.96.04 1.27.05 3.71.05s2.75-.01 3.71-.05c2.9-.13 4.51-1.74 4.64-4.64.04-.96.05-1.27.05-3.71v-1.2c0-2.44-.01-2.75-.05-3.71-.13-2.9-1.74-4.51-4.64-4.64C14.75 3.01 14.44 3 12 3Z",
  tiktok:
    "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.78a5.7 5.7 0 0 0-.77-.05 5.68 5.68 0 1 0 5.68 5.68V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48Z",
  messenger:
    "M12 3C6.93 3 3 6.72 3 11.25c0 2.37 1.07 4.42 2.8 5.83V21l3.3-1.81c.9.25 1.87.39 2.9.39 5.07 0 9-3.72 9-8.33S17.07 3 12 3Zm.93 11.1-2.3-2.45-4.47 2.45 4.92-5.22 2.35 2.45 4.42-2.45-4.92 5.22Z",
};

export function SocialIcon({ platform, className }: { platform: SocialLink["platform"]; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4 fill-current", className)}>
      <path d={PATHS[platform]} />
    </svg>
  );
}
