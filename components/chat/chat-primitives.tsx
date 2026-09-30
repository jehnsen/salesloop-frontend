import * as React from "react";
import { HeartPulse, Info, Sparkles, Store } from "lucide-react";
import type { ChatMessage } from "@/types";
import { MEDICAL_ADVICE_NOTICE } from "@/lib/constants";
import { cn, formatTime } from "@/lib/utils";

export function AIAvatar({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-leaf text-primary-foreground shadow-sm",
        size === "sm" && "size-7",
        size === "md" && "size-9",
        size === "lg" && "size-11",
        className,
      )}
      aria-hidden
    >
      <Sparkles className={size === "lg" ? "size-5" : size === "sm" ? "size-3.5" : "size-4"} />
    </span>
  );
}

export function SellerAvatar({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full bg-coffee text-white", className)} aria-hidden>
      <Store className="size-3.5" />
    </span>
  );
}

/**
 * One chat message. `perspective="customer"` puts the customer on the right (customer site);
 * `perspective="seller"` puts the AI/seller on the right (admin inbox).
 */
export function ChatBubble({
  message,
  perspective = "customer",
  children,
  footer,
}: {
  message: ChatMessage;
  perspective?: "customer" | "seller";
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center py-1">
        <p className="inline-flex max-w-[90%] items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
          <Info className="size-3 shrink-0" aria-hidden />
          {message.message}
        </p>
      </div>
    );
  }

  const fromCustomer = message.role === "customer";
  const alignRight = perspective === "customer" ? fromCustomer : !fromCustomer;
  const speaker = message.role === "assistant" ? "AI Assistant" : message.role === "seller" ? "Seller" : "Customer";

  return (
    <div className={cn("flex animate-fade-up gap-2", alignRight ? "flex-row-reverse" : "flex-row")}>
      {!fromCustomer && (message.role === "assistant" ? <AIAvatar size="sm" className="mt-0.5" /> : <SellerAvatar className="mt-0.5" />)}
      <div className={cn("flex max-w-[85%] min-w-0 flex-col gap-2", alignRight ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line",
            fromCustomer && perspective === "customer" && "rounded-br-md bg-primary text-primary-foreground",
            fromCustomer && perspective === "seller" && "rounded-bl-md border bg-card",
            message.role === "assistant" && (perspective === "customer" ? "rounded-bl-md border bg-card" : "rounded-br-md bg-primary-soft text-foreground"),
            message.role === "seller" && (perspective === "customer" ? "rounded-bl-md bg-coffee-soft" : "rounded-br-md bg-coffee-soft"),
            message.isDraft && "border-2 border-dashed border-primary/40 bg-card",
          )}
        >
          <span className="sr-only">{speaker}: </span>
          {message.message}
        </div>
        {children}
        <div className={cn("flex items-center gap-2 px-1 text-[11px] text-muted-foreground", alignRight && "flex-row-reverse")}>
          <time dateTime={message.timestamp}>{formatTime(message.timestamp)}</time>
          {perspective === "seller" && !fromCustomer && <span>· {speaker}</span>}
          {footer}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2" role="status" aria-label="Assistant is typing">
      <AIAvatar size="sm" />
      <div className="flex gap-1 rounded-2xl rounded-bl-md border bg-card px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 animate-typing rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export function QuickActions({
  actions,
  onSelect,
  disabled,
  className,
}: {
  actions: string[];
  onSelect: (action: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  if (!actions.length) return null;
  return (
    <div className={cn("no-scrollbar flex gap-2 overflow-x-auto", className)} aria-label="Suggested questions">
      {actions.map((a) => (
        <button
          key={a}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(a)}
          className="shrink-0 rounded-full border border-primary/25 bg-card px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:border-primary hover:bg-primary-soft disabled:opacity-50"
        >
          {a}
        </button>
      ))}
    </div>
  );
}

export function AIDisclaimer({ text, className }: { text: string; className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground", className)}>
      <Info className="mt-px size-3 shrink-0" aria-hidden />
      {text}
    </p>
  );
}

export function MedicalNotice({ className }: { className?: string }) {
  return (
    <div role="note" className={cn("flex items-start gap-2 rounded-xl border border-destructive/15 bg-danger-soft/60 px-3 py-2.5 text-xs text-foreground", className)}>
      <HeartPulse className="mt-px size-4 shrink-0 text-destructive" aria-hidden />
      <span>
        <strong className="font-semibold">Health question detected.</strong> {MEDICAL_ADVICE_NOTICE}
      </span>
    </div>
  );
}
