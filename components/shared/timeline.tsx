import {
  Bot,
  CalendarClock,
  ClipboardList,
  Globe,
  MessageCircle,
  ShoppingBag,
  StickyNote,
  User,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { TimelineEvent, TimelineEventType } from "@/types";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

const EVENT_STYLE: Record<TimelineEventType, { icon: LucideIcon; tone: string; label: string }> = {
  website_visit: { icon: Globe, tone: "bg-muted text-muted-foreground", label: "Website" },
  ai_message: { icon: Bot, tone: "bg-primary-soft text-accent-foreground", label: "AI" },
  customer_message: { icon: User, tone: "bg-info-soft text-info", label: "Customer" },
  seller_message: { icon: MessageCircle, tone: "bg-coffee-soft text-coffee", label: "Seller" },
  inquiry: { icon: ClipboardList, tone: "bg-warning-soft text-warning", label: "Inquiry" },
  follow_up: { icon: CalendarClock, tone: "bg-info-soft text-info", label: "Follow-up" },
  order: { icon: ShoppingBag, tone: "bg-success-soft text-success", label: "Order" },
  note: { icon: StickyNote, tone: "bg-secondary text-secondary-foreground", label: "Note" },
  stage_change: { icon: Workflow, tone: "bg-muted text-foreground", label: "Stage" },
};

export function Timeline({ events, className }: { events: TimelineEvent[]; className?: string }) {
  return (
    <ol className={cn("relative grid gap-5", className)}>
      {events.map((event, i) => {
        const style = EVENT_STYLE[event.type];
        const Icon = style.icon;
        return (
          <li key={event.id} className="relative flex gap-3">
            {i < events.length - 1 && <span className="absolute top-9 bottom-[-1.25rem] left-[15px] w-px bg-border" aria-hidden />}
            <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full", style.tone)}>
              <Icon className="size-4" aria-hidden />
              <span className="sr-only">{style.label}</span>
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium">{event.title}</p>
                <time dateTime={event.timestamp} title={formatDateTime(event.timestamp)} className="text-xs text-muted-foreground">
                  {timeAgo(event.timestamp)}
                </time>
              </div>
              {event.description && <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
