"use client";

import * as React from "react";
import { Code2, RotateCcw, SendHorizonal, X } from "lucide-react";
import type { AIAnalysis } from "@/types";
import { siteConfig } from "@/lib/mock-data/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AIAvatar, AIDisclaimer, ChatBubble, QuickActions, TypingIndicator } from "./chat-primitives";
import { ChatAttachments } from "./chat-attachments";
import { DEFAULT_QUICK_ACTIONS, useChat } from "./chat-provider";

/** Hidden AI metadata inspector: only rendered when NEXT_PUBLIC_AI_DEBUG=true (default in `next dev`). */
const AI_DEBUG = process.env.NEXT_PUBLIC_AI_DEBUG === "true";

function AnalysisInspector({ analysis }: { analysis: AIAnalysis }) {
  return (
    <details className="w-full max-w-xs rounded-lg border border-dashed border-info/40 bg-info-soft/40 text-[11px]">
      <summary className="flex cursor-pointer items-center gap-1 px-2 py-1 font-medium text-info">
        <Code2 className="size-3" aria-hidden /> AI analysis (dev only)
      </summary>
      <pre className="overflow-x-auto px-2 pb-2 font-mono leading-relaxed text-foreground">
        {JSON.stringify(
          {
            intent: analysis.intent,
            product: analysis.products[0],
            quantity: analysis.quantity,
            location: analysis.location,
            purchaseIntent: analysis.purchaseIntent,
            leadScore: analysis.leadScore,
            nextAction: analysis.nextAction,
            confidence: analysis.confidence,
            ...(analysis.medicalFlag ? { medicalFlag: true } : {}),
            ...(analysis.escalate ? { escalate: true } : {}),
          },
          null,
          2,
        )}
      </pre>
    </details>
  );
}

export function ChatPanel({ variant = "widget", className }: { variant?: "widget" | "page"; className?: string }) {
  const { messages, pending, send, closeChat, analyses, reset, agentActive } = useChat();
  const [draft, setDraft] = React.useState("");
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending]);

  React.useEffect(() => {
    if (variant === "widget") inputRef.current?.focus();
  }, [variant]);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestions = lastAssistant?.suggestions?.length ? lastAssistant.suggestions : DEFAULT_QUICK_ACTIONS;
  const lastId = messages.at(-1)?.id;

  function submit(text: string) {
    if (!text.trim()) return;
    void send(text);
    setDraft("");
    inputRef.current?.focus();
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-background", className)}>
      <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <AIAvatar size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm leading-tight font-semibold">AI Product Assistant</h2>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("size-2 rounded-full", agentActive ? "bg-success" : "bg-muted-foreground")} aria-hidden />
            {agentActive ? "Available 24/7" : "Offline: messages go to the seller"}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={reset} aria-label="Start a new conversation" title="New conversation">
          <RotateCcw />
        </Button>
        {variant === "widget" && (
          <Button variant="ghost" size="icon-sm" onClick={closeChat} aria-label="Close chat">
            <X />
          </Button>
        )}
      </header>

      <div className="border-b bg-cream/50 px-4 py-2">
        <AIDisclaimer text={siteConfig.disclaimers.ai} />
      </div>

      <div ref={listRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite" aria-relevant="additions">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m}>
            {m.attachments?.length ? <ChatAttachments attachments={m.attachments} isLatest={m.id === lastId} /> : null}
            {AI_DEBUG && m.role === "customer" && analyses[m.id] ? <AnalysisInspector analysis={analyses[m.id]} /> : null}
          </ChatBubble>
        ))}
        {pending && <TypingIndicator />}
      </div>

      <div className="space-y-2 border-t bg-card px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <QuickActions actions={suggestions} onSelect={submit} disabled={pending} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="chat-input" className="sr-only">
            Type your message
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(draft);
              }
            }}
            placeholder="Ask about products, prices, delivery…"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-input bg-background px-3.5 py-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none"
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || pending} aria-label="Send message">
            <SendHorizonal />
          </Button>
        </form>
      </div>
    </div>
  );
}
