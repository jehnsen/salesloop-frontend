import { useId } from "react";
import type { ProductTone, ProductVisual } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Product photography placeholder: a soft "studio" backdrop with a stylised packshot.
 * Replace with <Image src={product.imageUrl}> once real photos are uploaded.
 */
const TONES: Record<ProductTone, { bg: string; bg2: string; pack: string; packDark: string; accent: string }> = {
  coffee: { bg: "#f1e7dd", bg2: "#e4d3c3", pack: "#6b4a35", packDark: "#523826", accent: "#e9d6bd" },
  cream: { bg: "#f7efe2", bg2: "#ecdcc4", pack: "#d8bf98", packDark: "#b99b70", accent: "#6b4a35" },
  leaf: { bg: "#e8efe1", bg2: "#d4e2c8", pack: "#5e8c4f", packDark: "#48713c", accent: "#f5ecdc" },
  clay: { bg: "#f5e6da", bg2: "#ebd0bc", pack: "#c07a52", packDark: "#9f5f3c", accent: "#fbf3ea" },
  sage: { bg: "#ebf0e8", bg2: "#d9e3d5", pack: "#86a382", packDark: "#6b8867", accent: "#fbfaf6" },
  forest: { bg: "#e3ebe4", bg2: "#cbdacd", pack: "#2e5b3a", packDark: "#22452c", accent: "#e8d9bd" },
};

/** Approximate uppercase glyph advance as a fraction of the font size (bold UI sans). */
const GLYPH = 0.74;

/** Picks two words if they fit at a readable size, otherwise the first word, and sizes it to the space. */
function fitLabel(words: string[], maxWidth: number, size: number) {
  const widthAt = (s: string, fs: number) => s.length * (GLYPH * fs + 0.3);
  const two = words.slice(0, 2).join(" ");
  const text = widthAt(two, 7.5) <= maxWidth ? two : words[0] ?? "";
  const fontSize = Math.min(size, (maxWidth - text.length * 0.3) / (Math.max(text.length, 1) * GLYPH));
  return { text, fontSize };
}

type Palette = (typeof TONES)[ProductTone];

function Pack({ visual, c, words }: { visual: ProductVisual; c: Palette; words: string[] }) {
  const text = (y: number, maxWidth: number, size = 11, fill = c.accent) => {
    const fit = fitLabel(words, maxWidth, size);
    return (
      <text
        x="100"
        y={y}
        textAnchor="middle"
        fontSize={fit.fontSize}
        fontWeight={600}
        fill={fill}
        fontFamily="ui-sans-serif, system-ui"
        letterSpacing="0.3"
      >
        {fit.text}
      </text>
    );
  };
  switch (visual) {
    case "coffee":
    case "tea":
      return (
        <g>
          <rect x="55" y="48" width="90" height="112" rx="8" fill={c.pack} />
          <rect x="55" y="48" width="90" height="18" rx="8" fill={c.packDark} />
          <rect x="68" y="84" width="64" height="44" rx="22" fill={c.accent} opacity="0.95" />
          {visual === "coffee" ? (
            <g fill={c.pack}>
              <rect x="88" y="98" width="20" height="16" rx="4" />
              <path d="M108 101h3a4 4 0 0 1 0 8h-3" stroke={c.pack} strokeWidth="2.5" fill="none" />
              <path d="M93 93c0-3 3-3 3-6M100 93c0-3 3-3 3-6" stroke={c.pack} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <path d="M100 92v10" stroke={c.pack} strokeWidth="1.5" />
              <rect x="92" y="102" width="16" height="16" rx="2" fill={c.pack} />
            </g>
          )}
          {text(146, 72, 10)}
          {/* sachet leaning on the box */}
          <rect x="138" y="104" width="24" height="58" rx="3" fill={c.accent} transform="rotate(12 150 133)" stroke={c.packDark} strokeOpacity="0.25" />
        </g>
      );
    case "powder":
      return (
        <g>
          <path d="M62 60h76l6 96a8 8 0 0 1-8 8H64a8 8 0 0 1-8-8Z" fill={c.pack} />
          <rect x="60" y="52" width="80" height="14" rx="3" fill={c.packDark} />
          <circle cx="100" cy="106" r="24" fill={c.accent} />
          <path d="M90 108c4-8 16-8 20 0-4 8-16 8-20 0Z" fill={c.pack} />
          {text(150, 74, 10)}
        </g>
      );
    case "capsule":
      return (
        <g>
          <rect x="72" y="46" width="56" height="20" rx="4" fill={c.packDark} />
          <rect x="64" y="64" width="72" height="98" rx="14" fill={c.pack} />
          <rect x="70" y="92" width="60" height="44" rx="6" fill={c.accent} />
          {text(119, 52, 10, c.pack)}
          <g transform="rotate(-25 48 158)">
            <rect x="34" y="152" width="30" height="12" rx="6" fill={c.pack} />
            <rect x="49" y="152" width="15" height="12" rx="6" fill={c.accent} />
          </g>
          <g transform="rotate(18 150 160)">
            <rect x="138" y="154" width="30" height="12" rx="6" fill={c.packDark} />
            <rect x="153" y="154" width="15" height="12" rx="6" fill={c.accent} />
          </g>
        </g>
      );
    case "bottle":
      return (
        <g>
          <rect x="88" y="34" width="24" height="18" rx="3" fill={c.packDark} />
          <path d="M86 52h28v14c14 6 20 16 20 30v58a10 10 0 0 1-10 10H76a10 10 0 0 1-10-10V96c0-14 6-24 20-30Z" fill={c.pack} />
          <rect x="74" y="104" width="52" height="40" rx="6" fill={c.accent} />
          {text(128, 44, 10, c.pack)}
        </g>
      );
    case "soap":
      return (
        <g>
          <rect x="46" y="98" width="108" height="56" rx="22" fill={c.pack} />
          <rect x="56" y="104" width="88" height="40" rx="18" fill={c.accent} opacity="0.55" />
          {text(129, 76, 11, c.packDark)}
          <circle cx="140" cy="84" r="9" fill="none" stroke={c.packDark} strokeOpacity="0.45" strokeWidth="2" />
          <circle cx="158" cy="72" r="5" fill="none" stroke={c.packDark} strokeOpacity="0.35" strokeWidth="2" />
          <circle cx="126" cy="70" r="4" fill="none" stroke={c.packDark} strokeOpacity="0.3" strokeWidth="2" />
        </g>
      );
    case "jar":
    default:
      return (
        <g>
          <rect x="66" y="56" width="68" height="20" rx="5" fill={c.packDark} />
          <rect x="60" y="74" width="80" height="86" rx="12" fill={c.pack} />
          <rect x="66" y="98" width="68" height="38" rx="6" fill={c.accent} />
          {text(121, 60, 10, c.pack)}
        </g>
      );
  }
}

export function ProductImage({
  visual,
  tone,
  name,
  angle = 0,
  className,
  priority,
  transparent = false,
}: {
  visual: ProductVisual;
  tone: ProductTone;
  name: string;
  /** 0 = front, 1 = styled with props, 2 = close-up. Used by the gallery. */
  angle?: 0 | 1 | 2;
  className?: string;
  priority?: boolean;
  /** Let editorial product arrangements use their own studio backdrop. */
  transparent?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const c = TONES[tone];
  const words = name
    .split(/[\s(]/)
    .filter((w) => w && !/^\d/.test(w))
    .map((w) => w.toUpperCase());
  const transform = angle === 2 ? "translate(-50 -40) scale(1.5)" : angle === 1 ? "translate(12 6) scale(0.92)" : undefined;
  const gradientId = `bg-${id}`;
  const lightId = `light-${id}`;
  return (
    <div
      role="img"
      aria-label={`${name} product illustration`}
      data-priority={priority || undefined}
      className={cn("relative aspect-square w-full overflow-hidden", className)}
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <radialGradient id={gradientId} cx="35%" cy="25%" r="85%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="45%" stopColor={c.bg} />
            <stop offset="100%" stopColor={c.bg2} />
          </radialGradient>
          <linearGradient id={lightId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {!transparent && <rect width="200" height="200" fill={`url(#${gradientId})`} />}
        <ellipse cx="102" cy="177" rx="77" ry="12" fill={c.bg2} />
        <path d="M25 172v5c0 7 35 12 77 12s77-5 77-12v-5" fill={c.bg2} />
        <ellipse cx="102" cy="172" rx="77" ry="12" fill={c.bg} />
        {angle === 1 && (
          <g opacity="0.55">
            <path d="M20 170c10-30 30-40 40-38-4 14-20 30-40 38Z" fill={c.pack} opacity="0.35" />
            <path d="M24 150c14-18 30-22 36-20-6 10-20 18-36 20Z" fill={c.pack} opacity="0.25" />
            <path d="M168 113c-12-34-5-64 13-78 11 31 4 58-13 78Z" fill={c.packDark} opacity="0.3" />
            <path d="M173 112c4-25 15-41 27-44-1 23-10 37-27 44Z" fill={c.packDark} opacity="0.2" />
          </g>
        )}
        <ellipse cx="100" cy="168" rx="62" ry="7" fill="#000" opacity="0.08" />
        <g transform={transform}>
          <Pack visual={visual} c={c} words={words} />
          {(visual === "coffee" || visual === "tea") && <rect x="55" y="48" width="90" height="112" rx="8" fill={`url(#${lightId})`} />}
        </g>
      </svg>
    </div>
  );
}
