"use client";

import * as React from "react";
import { Bot, Hand, PenLine } from "lucide-react";
import type { AIAnalysis, AIMode, ChatMessage, Conversation } from "@/types";
import { AI_MODE_OPTIONS, CONVERSATION_CHANNEL_LABEL, NEXT_ACTION_LABEL } from "@/lib/constants";
import { cn, timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/misc";
import { ChatBubble } from "@/components/chat/chat-primitives";
import { ConversationStatusBadge, IntentBadge } from "@/components/shared/status-badges";

/** Admin-only rendering of the AI's structured analysis for a customer message. */
export function AnalysisChips({ analysis, productName }: { analysis: AIAnalysis; productName: (slug?: string) => string }) {
  return (
    <div className="flex max-w-md flex-wrap items-center gap-1.5 text-[11px]">
      <IntentBadge intent={analysis.intent} />
      {analysis.products[0] && <span className="rounded-full bg-muted px-2 py-0.5">{productName(analysis.products[0])}</span>}
      {analysis.quantity && <span className="rounded-full bg-muted px-2 py-0.5">Qty {analysis.quantity}</span>}
      {analysis.location && <span className="rounded-full bg-muted px-2 py-0.5">{analysis.location}</span>}
      {analysis.leadScore !== undefined && <span className="rounded-full bg-muted px-2 py-0.5 tabular-nums">Score {analysis.leadScore}</span>}
      {analysis.nextAction && (
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-accent-foreground">→ {NEXT_ACTION_LABEL[analysis.nextAction]}</span>
      )}
    </div>
  );
}

export function ConversationThread({
  messages,
  productName,
  showAnalysis = true,
  renderDraftActions,
  className,
}: {
  messages: ChatMessage[];
  productName: (slug?: string) => string;
  showAnalysis?: boolean;
  renderDraftActions?: (m: ChatMessage) => React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((m) => (
        <ChatBubble
          key={m.id}
          message={m}
          perspective="seller"
          footer={m.isDraft ? <span className="font-medium text-primary">AI draft · not sent</span> : undefined}
        >
          {showAnalysis && m.role === "customer" && m.analysis && <AnalysisChips analysis={m.analysis} productName={productName} />}
          {m.isDraft && renderDraftActions?.(m)}
        </ChatBubble>
      ))}
    </div>
  );
}

export function ConversationListItem({
  conversation,
  active,
  onSelect,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
}) {
  const last = conversation.messages.filter((m) => !m.isDraft && m.role !== "system").at(-1);
  const hasDraft = conversation.messages.some((m) => m.isDraft);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 border-l-2 px-4 py-3.5 text-left transition-colors",
        active ? "border-primary bg-primary-soft/50" : "border-transparent hover:bg-muted/50",
      )}
    >
      <Avatar name={conversation.customerName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn("truncate text-sm", conversation.unread ? "font-semibold" : "font-medium")}>{conversation.customerName}</p>
          <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(conversation.lastMessageAt)}</span>
        </div>
        <p className={cn("truncate text-xs", conversation.unread ? "text-foreground" : "text-muted-foreground")}>
          {last?.role === "assistant" ? "AI: " : last?.role === "seller" ? "You: " : ""}
          {last?.message}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <ConversationStatusBadge status={conversation.status} />
          <span className="text-[11px] text-muted-foreground">{CONVERSATION_CHANNEL_LABEL[conversation.channel]}</span>
          {hasDraft && <span className="text-[11px] font-medium text-primary">· Draft ready</span>}
          {conversation.unread > 0 && (
            <span className="ml-auto rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-white">{conversation.unread}</span>
          )}
        </div>
      </div>
    </button>
  );
}

const MODE_ICON: Record<AIMode, React.ComponentType<{ className?: string }>> = {
  auto_reply: Bot,
  draft_only: PenLine,
  human_only: Hand,
};

export function AIModeToggle({ value, onChange, disabled }: { value: AIMode; onChange: (mode: AIMode) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label="AI mode" className="inline-flex rounded-full bg-muted p-1">
      {AI_MODE_OPTIONS.map((o) => {
        const Icon = MODE_ICON[o.id];
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            title={o.description}
            onClick={() => onChange(o.id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-60",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
