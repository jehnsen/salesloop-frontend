import { cn } from "@/lib/utils";

/** Circular meter for a 0–100 lead score. The track is a lighter step of the fill. */
export function ScoreRing({ score, size = 88, className }: { score: number; size?: number; className?: string }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = score >= 80 ? ["#2f7d4f", "#e5f2ea"] : score >= 50 ? ["#9a6512", "#fbf0dc"] : ["#7a7d73", "#f0eee8"];
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }} role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Lead score">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone[1]} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone[0]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl leading-none font-semibold tabular-nums">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
