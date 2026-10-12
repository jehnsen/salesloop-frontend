"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { HeroSlide } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AskAIButton } from "@/components/chat/ask-ai-button";
import { Container } from "@/components/layout/page-primitives";

/** How long each slide stays up before advancing. */
const SLIDE_MS = 8000;

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

/** True when the visitor asked for less data, or is on a connection too slow for background video. */
function prefersLightweight() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(connection?.saveData) || ["slow-2g", "2g"].includes(connection?.effectiveType ?? "");
}

/**
 * Full-bleed hero carousel of short, muted background clips.
 *
 * - Only the active clip plays; the others are attached lazily, so the first paint is just a poster image.
 * - Auto-advances every SLIDE_MS, pausing while the visitor hovers the copy, focuses a control, or presses pause.
 * - Reduced motion: nothing moves until the visitor presses play. Save-Data / 2G: posters only.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;
  const [index, setIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [held, setHeld] = React.useState(false);
  const [allowVideo, setAllowVideo] = React.useState(false);
  /** Slides whose video file has been requested. */
  const [attached, setAttached] = React.useState<number[]>([]);

  const rootRef = React.useRef<HTMLElement>(null);
  const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]);
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

  // Decide after mount: the server can't know motion or data preferences.
  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setAllowVideo(!prefersLightweight());
    setPlaying(!reduced);
  }, []);

  // Attach the active clip now and the next one shortly after, so the cross-fade lands on moving video.
  React.useEffect(() => {
    if (!allowVideo) return;
    setAttached((list) => (list.includes(index) ? list : [...list, index]));
    const next = (index + 1) % count;
    const timer = window.setTimeout(() => setAttached((list) => (list.includes(next) ? list : [...list, next])), 2500);
    return () => window.clearTimeout(timer);
  }, [allowVideo, index, count]);

  // Play only the active clip.
  React.useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === index && playing && allowVideo && attached.includes(i)) {
        video.muted = true;
        void video.play().catch(() => undefined);
      } else {
        video.pause();
        if (i !== index) video.currentTime = 0;
      }
    });
  }, [index, playing, allowVideo, attached]);

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
      className="botanical-hero relative isolate h-[640px] overflow-hidden text-white sm:h-[660px] lg:h-[min(82vh,760px)] lg:min-h-[600px]"
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
      {slides.map((slide, i) => {
        const active = i === index;
        const Heading = i === 0 ? "h1" : "h2";
        return (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${slide.label}`}
            aria-hidden={!active}
            inert={!active}
            data-active={active}
            className="hero-slide absolute inset-0"
          >
            <div className="hero-media absolute inset-0">
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                src={attached.includes(i) ? slide.video : undefined}
                poster={slide.poster}
                muted
                loop
                playsInline
                preload="auto"
                disablePictureInPicture
                tabIndex={-1}
                aria-hidden
                className="size-full object-cover"
              />
            </div>
            <div className="hero-scrim absolute inset-0" aria-hidden />
            <Container className="relative flex h-full items-end pb-36 lg:items-center lg:pb-24">
              <div className="max-w-xl" {...hold}>
                <p className="hero-rise mb-6 inline-flex items-center gap-2.5 text-[10px] font-medium tracking-[0.22em] text-sage uppercase sm:text-xs">
                  <span className="hero-rule h-px w-7 bg-gold" style={delay(250)} aria-hidden /> {slide.eyebrow}
                </p>
                <Heading className="font-display text-[clamp(2.6rem,5.4vw,5rem)] leading-[1.04] font-normal tracking-[-0.045em]">
                  <span className="hero-line">
                    <span style={delay(120)}>{slide.title}</span>
                  </span>
                  <span className="hero-line">
                    <span style={delay(260)}>
                      <span className="hero-shimmer font-light italic">{slide.highlight}</span>
                    </span>
                  </span>
                </Heading>
                <p className="hero-rise mt-6 max-w-md text-base leading-relaxed text-white/80 sm:text-lg" style={delay(480)}>
                  {slide.description}
                </p>
                <div className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row" style={delay(620)}>
                  <Button
                    size="lg"
                    variant="gold"
                    asChild
                    className="hero-cta [&_svg]:transition-transform [&_svg]:duration-300 hover:[&_svg]:translate-x-0.5 hover:[&_svg]:-translate-y-0.5"
                  >
                    <Link href={slide.primary.href}>
                      {slide.primary.label} <ArrowUpRight aria-hidden />
                    </Link>
                  </Button>
                  {slide.secondary.href ? (
                    <Button size="lg" variant="outline" asChild className="border-white/30 bg-white/5 text-white backdrop-blur-sm hover:border-white/60 hover:bg-white/15">
                      <Link href={slide.secondary.href}>{slide.secondary.label}</Link>
                    </Button>
                  ) : (
                    <AskAIButton
                      size="lg"
                      variant="outline"
                      prompt={slide.secondary.aiPrompt}
                      className="border-white/30 bg-white/5 text-white backdrop-blur-sm hover:border-white/60 hover:bg-white/15"
                    >
                      {slide.secondary.label}
                    </AskAIButton>
                  )}
                </div>
              </div>
            </Container>
          </div>
        );
      })}

      <div className="absolute inset-x-0 bottom-0 z-10 pb-6 sm:pb-8" {...hold}>
        {/* Controls stay left: the bottom-right corner belongs to the floating chat button. */}
        <Container className="flex items-end gap-3 sm:gap-5">
          <ControlButton label={playing ? "Pause slideshow" : "Play slideshow"} onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
          </ControlButton>
          <div className="flex max-w-xl flex-1 gap-3 sm:gap-5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${slide.label}`}
                aria-current={i === index ? "true" : undefined}
                className="group flex-1 py-2 text-left"
              >
                <span className="block h-0.5 w-full overflow-hidden rounded-full bg-white/25">
                  <span
                    ref={(el) => {
                      barRefs.current[i] = el;
                    }}
                    className="hero-progress-fill block h-full rounded-full bg-gold"
                    // The active bar is driven by the animation frame loop above, not by React.
                    style={i === index ? undefined : { transform: `scaleX(${i < index ? 1 : 0})` }}
                  />
                </span>
                <span
                  className={cn(
                    "mt-3 flex items-baseline gap-2 text-xs transition-colors",
                    i === index ? "text-white" : "text-white/60 group-hover:text-white/90",
                  )}
                >
                  <span className="tracking-[0.14em] tabular-nums">0{i + 1}</span>
                  <span className="hidden font-medium sm:inline">{slide.label}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <ControlButton label="Previous slide" onClick={() => go(index - 1)}>
              <ChevronLeft className="size-5" aria-hidden />
            </ControlButton>
            <ControlButton label="Next slide" onClick={() => go(index + 1)}>
              <ChevronRight className="size-5" aria-hidden />
            </ControlButton>
          </div>
        </Container>
      </div>

      {/* Announce slide changes only when the visitor is driving. */}
      <p className="sr-only" aria-live={running ? "off" : "polite"}>
        Slide {index + 1} of {count}: {slides[index]?.label}
      </p>
    </section>
  );
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-10 items-center justify-center rounded-full border border-white/30 bg-white/5 text-white backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/15 sm:size-11"
    >
      {children}
    </button>
  );
}
