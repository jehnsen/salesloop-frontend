"use client";

import { ChatPanel } from "./chat-panel";

/** Full-page chat for /ai-assistant. Shares state with the floating widget via ChatProvider. */
export function AssistantPageChat() {
  return (
    <div className="h-[calc(100dvh-7rem)] min-h-[520px] overflow-hidden rounded-3xl border bg-card shadow-lift lg:h-[calc(100dvh-9rem)]">
      <ChatPanel variant="page" />
    </div>
  );
}
