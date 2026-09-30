"use client";

import * as React from "react";
import { MessageCircleQuestion, ShieldCheck, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AIAvatar, ChatBubble, TypingIndicator } from "@/components/chat/chat-primitives";
import { useChat } from "@/components/chat/chat-provider";

/** Static, pre-approved sample exchanges for the homepage preview. */
const EXAMPLES: { label: string; question: string; answer: string }[] = [
  {
    label: "Compare coffees",
    question: "Ano difference ng black coffee at 3-in-1?",
    answer:
      "Black coffee has a simpler coffee profile, while 3-in-1 includes additional ingredients for a creamier and sweeter taste. Would you like me to compare the available options?",
  },
  {
    label: "Price & quantity",
    question: "Magkano Lingzhi Coffee? Maybe kukuha ako tatlo.",
    answer:
      "We currently have Lingzhi Coffee available. You're considering 3 boxes—is that correct? I can also help check delivery availability. What city or municipality are you located in?",
  },
  {
    label: "Health question",
    question: "Pwede ba 'to sa may diabetes?",
    answer:
      "I'm not able to give medical advice. Please consult a qualified healthcare professional before trying any product. I can share the approved label information, or connect you with the seller.",
  },
];

const stamp = "2026-01-01T09:00:00+08:00";

export function AIPreview() {
  const { openChat } = useChat();
  const [active, setActive] = React.useState(0);
  const [typing, setTyping] = React.useState(false);

  React.useEffect(() => {
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 900);
    return () => clearTimeout(t);
  }, [active]);

  const example = EXAMPLES[active];
  const customer: ChatMessage = { id: `q${active}`, role: "customer", message: example.question, timestamp: stamp };
  const reply: ChatMessage = { id: `a${active}`, role: "assistant", message: example.answer, timestamp: stamp };

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div className="space-y-6">
        <p className="text-xs font-semibold tracking-[0.14em] text-leaf uppercase">AI Sales Assistant</p>
        <h2 className="font-display text-3xl font-medium tracking-tight text-balance sm:text-4xl">
          Questions at 11 PM? Our assistant is awake.
        </h2>
        <p className="text-lg text-pretty text-muted-foreground">
          Ask in English, Filipino, or Taglish. The assistant answers using the seller&apos;s approved product
          information, helps you compare, and prepares your order inquiry. The seller confirms everything personally.
        </p>
        <ul className="grid gap-3 text-sm">
          {[
            "Explains differences between products in simple terms",
            "Checks availability and delivery areas",
            "Hands you over to the seller anytime you ask",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-leaf" aria-hidden />
              {item}
            </li>
          ))}
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf" aria-hidden />
            Never gives medical advice. Health questions are referred to a professional.
          </li>
        </ul>
        <Button size="lg" onClick={() => openChat({ prompt: example.question })}>
          <MessageCircleQuestion aria-hidden /> Start a Conversation
        </Button>
      </div>

      <div className="rounded-3xl border bg-gradient-to-br from-cream via-card to-primary-soft/60 p-3 shadow-lift sm:p-5">
        <div className="overflow-hidden rounded-2xl border bg-background">
          <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
            <AIAvatar />
            <div>
              <p className="text-sm font-semibold">AI Product Assistant</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-success" aria-hidden /> Available 24/7
              </p>
            </div>
          </div>
          <div className="min-h-[260px] space-y-4 p-4" aria-live="polite">
            <ChatBubble message={customer} />
            {typing ? <TypingIndicator /> : <ChatBubble message={reply} />}
          </div>
          <div role="tablist" aria-label="Example questions" className="no-scrollbar flex gap-2 overflow-x-auto border-t bg-card p-3">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex.label}
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  i === active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
