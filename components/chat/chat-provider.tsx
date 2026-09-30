"use client";

import * as React from "react";
import type { AIAnalysis, ChatMessage, ContactChannel, Product } from "@/types";
import {
  getAgentStatus,
  getProductGreeting,
  initialSessionState,
  sendCustomerMessage,
  submitChatLeadForm,
  type ChatSessionState,
} from "@/services/ai-agent";
import { getAllProducts } from "@/services/products";
import { createId } from "@/lib/utils";

const STORAGE_KEY = "luntian-chat-session-v1";

export const DEFAULT_QUICK_ACTIONS = [
  "Recommend a coffee",
  "Compare products",
  "Check availability",
  "How do I order?",
  "Talk to seller",
];

interface StoredSession {
  sessionId: string;
  messages: ChatMessage[];
  state: ChatSessionState;
  analyses: Record<string, AIAnalysis>;
}

interface ChatContextValue {
  isOpen: boolean;
  openChat: (options?: { productSlug?: string; prompt?: string }) => void;
  closeChat: () => void;
  messages: ChatMessage[];
  pending: boolean;
  send: (text: string) => Promise<void>;
  submitLead: (form: { name: string; mobile: string; preferredChannel: ContactChannel }) => Promise<void>;
  state: ChatSessionState;
  products: Product[];
  /** Internal AI analysis per customer message id. Only rendered in dev debug mode. */
  analyses: Record<string, AIAnalysis>;
  agentActive: boolean;
  reset: () => void;
}

const ChatContext = React.createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = React.useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}

function newSession(greeting?: string): StoredSession {
  return {
    sessionId: createId("chat"),
    state: initialSessionState,
    analyses: {},
    messages: greeting
      ? [
          {
            id: createId("msg"),
            role: "assistant",
            message: greeting,
            timestamp: new Date().toISOString(),
            suggestions: DEFAULT_QUICK_ACTIONS,
          },
        ]
      : [],
  };
}

function readStored(): StoredSession | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [session, setSession] = React.useState<StoredSession>(() => newSession());
  const [pending, setPending] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [agentActive, setAgentActive] = React.useState(true);
  const greetingRef = React.useRef<string>("");
  const sessionRef = React.useRef(session);
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    sessionRef.current = session;
    if (!hydrated.current) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage unavailable (private mode): the chat still works for this page view.
    }
  }, [session]);

  // Load products, agent status, and any conversation from earlier in this tab.
  React.useEffect(() => {
    let cancelled = false;
    Promise.all([getAllProducts(), getAgentStatus()]).then(([list, status]) => {
      if (cancelled) return;
      setProducts(list);
      setAgentActive(status.active);
      greetingRef.current = status.greeting;
      const stored = readStored();
      hydrated.current = true;
      setSession(stored?.messages.length ? stored : newSession(status.greeting));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const append = React.useCallback((message: ChatMessage) => {
    setSession((s) => ({ ...s, messages: [...s.messages, message] }));
  }, []);

  const send = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;
      const localId = createId("msg");
      append({ id: localId, role: "customer", message: trimmed, timestamp: new Date().toISOString() });
      setPending(true);
      try {
        const current = sessionRef.current;
        const result = await sendCustomerMessage(current.sessionId, trimmed, current.state);
        setAgentActive(result.agentActive);
        setSession((s) => ({
          ...s,
          state: result.state,
          analyses: { ...s.analyses, [localId]: result.analysis },
          messages: [...s.messages, result.reply],
        }));
      } catch {
        append({
          id: createId("msg"),
          role: "system",
          message: "Message not delivered. Please check your connection and try again.",
          timestamp: new Date().toISOString(),
        });
      } finally {
        setPending(false);
      }
    },
    [append, pending],
  );

  const submitLead = React.useCallback(
    async (form: { name: string; mobile: string; preferredChannel: ContactChannel }) => {
      const current = sessionRef.current;
      const result = await submitChatLeadForm(current.sessionId, form, current.state);
      setSession((s) => ({ ...s, state: result.state, messages: [...s.messages, result.reply] }));
    },
    [],
  );

  const openChat = React.useCallback(
    (options?: { productSlug?: string; prompt?: string }) => {
      setIsOpen(true);
      const slug = options?.productSlug;
      if (slug && slug !== sessionRef.current.state.productSlug) {
        setSession((s) => ({ ...s, state: { ...s.state, productSlug: slug, quantity: undefined } }));
        void getProductGreeting(slug).then((greeting) => {
          if (!greeting) return;
          append({
            id: createId("msg"),
            role: "assistant",
            message: greeting.message,
            timestamp: new Date().toISOString(),
            suggestions: greeting.suggestions,
            attachments: [{ type: "product_cards", productSlugs: [slug] }],
          });
        });
      }
      if (options?.prompt) void send(options.prompt);
    },
    [append, send],
  );

  const closeChat = React.useCallback(() => setIsOpen(false), []);

  const reset = React.useCallback(() => {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSession(newSession(greetingRef.current));
  }, []);

  const value = React.useMemo<ChatContextValue>(
    () => ({
      isOpen,
      openChat,
      closeChat,
      messages: session.messages,
      pending,
      send,
      submitLead,
      state: session.state,
      products,
      analyses: session.analyses,
      agentActive,
      reset,
    }),
    [isOpen, openChat, closeChat, session, pending, send, submitLead, products, agentActive, reset],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
