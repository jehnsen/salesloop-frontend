"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
import { useChat } from "./chat-provider";

/**
 * Global floating assistant. Desktop: panel anchored bottom-right.
 * Mobile: full-screen sheet. Hidden on /ai-assistant, which renders the panel inline.
 */
export function ChatWidget() {
  const { isOpen, openChat, closeChat, messages } = useChat();
  const pathname = usePathname();
  const onAssistantPage = pathname === "/ai-assistant";

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeChat();
    window.addEventListener("keydown", onKey);
    // Lock page scroll behind the full-screen mobile chat.
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    if (mobile) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeChat]);

  React.useEffect(() => {
    if (onAssistantPage && isOpen) closeChat();
  }, [onAssistantPage, isOpen, closeChat]);

  if (onAssistantPage) return null;

  const hasConversation = messages.some((m) => m.role === "customer");

  return (
    <>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="AI Product Assistant"
          className="fixed inset-0 z-50 flex animate-fade-up flex-col overflow-hidden bg-background md:inset-auto md:right-6 md:bottom-24 md:h-[min(680px,calc(100dvh-8rem))] md:w-[400px] md:rounded-2xl md:border md:shadow-lift"
        >
          <ChatPanel variant="widget" />
        </div>
      )}
      <button
        type="button"
        onClick={() => (isOpen ? closeChat() : openChat())}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={isOpen}
        className={cn(
          "fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-primary py-3 pr-5 pl-4 text-sm font-medium text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5 md:right-6 md:bottom-6",
          isOpen && "hidden md:flex md:pr-4",
        )}
      >
        {isOpen ? <X className="size-5" aria-hidden /> : <MessageCircle className="size-5" aria-hidden />}
        {!isOpen && <span>{hasConversation ? "Continue chat" : "Ask AI"}</span>}
        {!isOpen && !hasConversation && (
          <span className="absolute -top-1 -right-1 flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf opacity-60" />
            <span className="relative inline-flex size-3 rounded-full border-2 border-background bg-leaf" />
          </span>
        )}
      </button>
    </>
  );
}
