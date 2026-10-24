"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { HeroSlide } from "@/types";
import { siteConfig } from "@/lib/mock-data/site";
import { cn } from "@/lib/utils";

/** How long each banner stays up before advancing. */
const SLIDE_MS = 6000;

/**
 * Full-width banner carousel. The headline and button are drawn into each image, so a slide is one link.
 *
 * - Auto-advances every SLIDE_MS, pausing while the visitor hovers a banner, focuses a control, or presses pause.
 * - Reduced motion: nothing moves until the visitor presses play.
 * - Phones show a 4:3 crop anchored on each banner's text; wider screens show the full-width banner.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;
  const [index, setIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [held, setHeld] = React.useState(false);

  const rootRef = React.useRef<HTMLElement>(null);
  const barRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const elapsed = React.useRef(0);
  const touchStart = React.useRef<number | null>(null);

  const go = React.useCallback(
    (next: number) => {
      elapsed.current = 0;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  // Decide after mount: the server can't know the motion preference.
  React.useEffect(() => {
    setPlaying(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Progress + auto-advance. requestAnimationFrame stops in background tabs, so the timer does too.
  const running = playing && !held;
  React.useEffect(() => {
    const bar = barRefs.current[index];
    if (bar) bar.style.transform = `scaleX(${Math.min(elapsed.current / SLIDE_MS, 1)})`;
    if (!running || count < 2) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += Math.min(now - last, 100);
      last = now;
      const progress = Math.min(elapsed.current / SLIDE_MS, 1);
      if (bar) bar.style.transform = `scaleX(${progress})`;
      if (progress >= 1) go(index + 1);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, index, count, go]);

  const hold = { onMouseEnter: () => setHeld(true), onMouseLeave: () => setHeld(false) };

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative isolate aspect-4/3 overflow-hidden bg-surface sm:aspect-7/3"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      // Hold for keyboard focus only: a mouse click also focuses the button and would freeze the rotation.
      onFocusCapture={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) setHeld(true);
      }}
      onBlurCapture={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setHeld(false);
      }}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        touchStart.current = null;
        const end = e.changedTouches[0]?.clientX;
        if (start === null || end === undefined || Math.abs(end - start) < 48) return;
        go(index + (end < start ? 1 : -1));
      }}
    >
      <h1 className="sr-only">
        {siteConfig.storeName}: {siteConfig.tagline}
      </h1>

      {slides.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${slide.label}`}
            aria-hidden={!active}
            inert={!active}
            data-active={active}
            className="absolute inset-0 invisible opacity-0 transition-[opacity,visibility] duration-700 data-[active=true]:visible data-[active=true]:opacity-100"
            {...hold}
          >
            <Link href={slide.href} aria-label={slide.alt} className="absolute inset-0 block focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary">
              <Image
                src={slide.image}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover [object-position:var(--focus-m)] sm:[object-position:var(--focus-d)]"
                style={{ "--focus-m": slide.focus.mobile, "--focus-d": slide.focus.desktop } as React.CSSProperties}
              />
            </Link>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden items-center pl-4 sm:flex lg:pl-6">
            <ControlButton label="Previous slide" onClick={() => go(index - 1)} {...hold}>
              <ChevronLeft className="size-5" aria-hidden />
            </ControlButton>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden items-center pr-4 sm:flex lg:pr-6">
            <ControlButton label="Next slide" onClick={() => go(index + 1)} {...hold}>
              <ChevronRight className="size-5" aria-hidden />
            </ControlButton>
          </div>
        </>
      )}

      {/* Bottom-left sits over blurred foliage in every banner; the bottom-right corner belongs to the floating chat button. */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-black/35 py-1 pr-3 pl-1 backdrop-blur-sm sm:bottom-5 sm:left-6 lg:left-8" {...hold}>
        <button
          type="button"
          aria-label={playing ? "Pause slideshow" : "Play slideshow"}
          title={playing ? "Pause slideshow" : "Play slideshow"}
          onClick={() => setPlaying((p) => !p)}
          className="flex size-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
        >
          {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
        </button>
        <div className="flex gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show slide ${i + 1}: ${slide.label}`}
              aria-current={i === index ? "true" : undefined}
              className="group py-2"
            >
              <span className="block h-1 w-8 overflow-hidden rounded-full bg-white/40 sm:w-12">
                <span
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                  className={cn("block h-full origin-left rounded-full bg-white", i !== index && "transition-none")}
                  // The active bar is driven by the animation frame loop above, not by React.
                  style={i === index ? undefined : { transform: `scaleX(${i < index ? 1 : 0})` }}
                />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Announce slide changes only when the visitor is driving. */}
      <p className="sr-only" aria-live={running ? "off" : "polite"}>
        Slide {index + 1} of {count}: {slides[index]?.label}
      </p>
    </section>
  );
}

function ControlButton({
  label,
  onClick,
  children,
  ...rest
}: { label: string; onClick: () => void; children: React.ReactNode } & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 sm:size-11"
      {...rest}
    >
      {children}
    </button>
  );
}
