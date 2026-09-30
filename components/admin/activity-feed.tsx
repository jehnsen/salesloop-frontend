import Link from "next/link";
import {
  AlertTriangle,
  CalendarPlus,
  Flame,
  MessageSquareText,
  PenLine,
  Repeat,
  ShieldAlert,
  ThumbsUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { AIActivity, AIActivityType } from "@/types";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

const STYLE: Record<AIActivityType, { icon: LucideIcon; tone: string }> = {
  answered_inquiry: { icon: MessageSquareText, tone: "bg-info-soft text-info" },
  detected_high_intent: { icon: Flame, tone: "bg-warning-soft text-warning" },
  captured_lead: { icon: UserPlus, tone: "bg-success-soft text-success" },
  created_follow_up: { icon: CalendarPlus, tone: "bg-primary-soft text-accent-foreground" },
  recommended_product: { icon: ThumbsUp, tone: "bg-coffee-soft text-coffee" },
  detected_reorder: { icon: Repeat, tone: "bg-success-soft text-success" },
  escalated: { icon: AlertTriangle, tone: "bg-danger-soft text-destructive" },
  drafted_message: { icon: PenLine, tone: "bg-muted text-foreground" },
  blocked_claim: { icon: ShieldAlert, tone: "bg-danger-soft text-destructive" },
};

export function ActivityFeed({ items, compact }: { items: AIActivity[]; compact?: boolean }) {
  return (
    <ol className="grid gap-4">
      {items.map((a) => {
        const s = STYLE[a.type];
        const href = a.leadId ? `/admin/leads/${a.leadId}` : a.customerId ? `/admin/customers/${a.customerId}` : undefined;
        return (
          <li key={a.id} className="flex gap-3">
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", s.tone)}>
              <s.icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{a.action}</span>
                <span className="text-muted-foreground"> · </span>
                {href ? (
                  <Link href={href} className="text-muted-foreground hover:text-foreground hover:underline">
                    {a.customerName}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">{a.customerName}</span>
                )}
              </p>
              {!compact && <p className="line-clamp-2 text-xs text-muted-foreground">{a.reasoning}</p>}
              <time dateTime={a.timestamp} title={formatDateTime(a.timestamp)} className="text-[11px] text-muted-foreground">
                {timeAgo(a.timestamp)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
