"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCheck, Info, MessagesSquare, SendHorizonal, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { AIMode, ChatMessage, Conversation } from "@/types";
import {
  approveDraft,
  discardDraft,
  generateDraftReply,
  getConversations,
  markConversationRead,
  sendSellerMessage,
  setConversationMode,
  setConversationStatus,
} from "@/services/conversations";
import { useAsync, useDbChange } from "@/lib/hooks/use-async";
import { useProductLookup } from "@/lib/hooks/use-products";
import { AI_MODE_OPTIONS, CONVERSATION_CHANNEL_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FilterChips, TableSkeleton } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { ConversationStatusBadge } from "@/components/shared/status-badges";
import { AIModeToggle, ConversationListItem, ConversationThread } from "@/components/admin/conversation-parts";
import { CustomerIntelPanel } from "@/components/admin/customer-intel-panel";

type ListFilter = "all" | "needs_seller" | "ai_handling" | "unread";

export default function ConversationsPage() {
  return (
    <React.Suspense fallback={<TableSkeleton />}>
      <Inbox />
    </React.Suspense>
  );
}

function Inbox() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("c");
  const list = useAsync(getConversations);
  const { name } = useProductLookup();
  const [filter, setFilter] = React.useState<ListFilter>("all");
  const [search, setSearch] = React.useState("");
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  useDbChange(() => void list.reload({ silent: true }));

  const conversations = list.data ?? [];
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  // Mark as read when opened.
  React.useEffect(() => {
    if (selected && selected.unread > 0) {
      void markConversationRead(selected.id).then((updated) => replace(updated));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  function replace(updated: Conversation) {
    list.setData((cs) => cs?.map((c) => (c.id === updated.id ? updated : c)));
  }

  function select(id: string | null) {
    router.replace(id ? `/admin/conversations?c=${id}` : "/admin/conversations", { scroll: false });
  }

  const filtered = conversations.filter((c) => {
    if (filter === "needs_seller" && c.status !== "needs_seller") return false;
    if (filter === "ai_handling" && c.status !== "ai_handling") return false;
    if (filter === "unread" && c.unread === 0) return false;
    return !search || c.customerName.toLowerCase().includes(search.toLowerCase());
  });

  if (list.error) return <ErrorState action={<Button onClick={() => list.reload()}>Retry</Button>} />;

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8 lg:-my-8">
      <div className="grid h-[calc(100dvh-4rem)] grid-cols-1 overflow-hidden border-t bg-card md:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_320px]">
        {/* Conversation list */}
        <section aria-label="Conversations" className={cn("flex min-h-0 flex-col border-r", selected && "hidden md:flex")}>
          <div className="space-y-3 border-b p-4">
            <h1 className="text-lg font-semibold">Conversations</h1>
            <SearchInput value={search} onChange={setSearch} placeholder="Search customers" label="Search conversations" />
            <FilterChips
              label="Filter conversations"
              value={filter}
              onChange={setFilter}
              options={[
                { id: "all", label: "All" },
                { id: "needs_seller", label: "Needs you", count: conversations.filter((c) => c.status === "needs_seller").length },
                { id: "unread", label: "Unread" },
                { id: "ai_handling", label: "AI" },
              ]}
            />
          </div>
          <div className="scrollbar-thin flex-1 divide-y overflow-y-auto">
            {list.loading ? (
              <div className="p-4"><TableSkeleton columns={1} rows={6} /></div>
            ) : filtered.length === 0 ? (
              <EmptyState compact className="m-4" icon={MessagesSquare} title="No conversations" description="Try another filter." />
            ) : (
              filtered.map((c) => (
                <ConversationListItem key={c.id} conversation={c} active={c.id === selectedId} onSelect={() => select(c.id)} />
              ))
            )}
          </div>
        </section>

        {/* Thread */}
        <section aria-label="Conversation thread" className={cn("flex min-h-0 min-w-0 flex-col", !selected && "hidden md:flex")}>
          {selected ? (
            <Thread
              key={selected.id}
              conversation={selected}
              productName={name}
              onBack={() => select(null)}
              onDetails={() => setDetailsOpen(true)}
              onChange={replace}
            />
          ) : (
            <EmptyState className="m-6 flex-1 border-none" icon={MessagesSquare} title="Select a conversation" description="Conversations flagged “Needs seller” are waiting for your reply." />
          )}
        </section>

        {/* Intelligence panel */}
        <aside aria-label="Customer intelligence" className="hidden min-h-0 overflow-y-auto border-l bg-background/60 xl:block">
          {selected ? <CustomerIntelPanel key={selected.id} conversation={selected} productName={name} /> : null}
        </aside>
      </div>

      <Sheet open={detailsOpen && Boolean(selected)} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>Customer intelligence</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto">{selected && <CustomerIntelPanel conversation={selected} productName={name} />}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Thread({
  conversation,
  productName,
  onBack,
  onDetails,
  onChange,
}: {
  conversation: Conversation;
  productName: (slug?: string) => string;
  onBack: () => void;
  onDetails: () => void;
  onChange: (c: Conversation) => void;
}) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<{ id: string; text: string } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conversation.messages.length]);

  async function run(label: string, fn: () => Promise<Conversation>, success?: string) {
    setBusy(label);
    try {
      onChange(await fn());
      if (success) toast.success(success);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const send = () => {
    if (!text.trim()) return;
    const value = text.trim();
    setText("");
    void run("send", () => sendSellerMessage(conversation.id, value));
  };

  const modeLabel = AI_MODE_OPTIONS.find((o) => o.id === conversation.aiMode);

  const draftActions = (m: ChatMessage) =>
    editing?.id === m.id ? (
      <div className="w-full max-w-md space-y-2">
        <Textarea value={editing.text} onChange={(e) => setEditing({ id: m.id, text: e.target.value })} aria-label="Edit AI draft" className="text-sm" />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          <Button size="sm" loading={busy === "approve"} onClick={() => run("approve", () => approveDraft(conversation.id, m.id, editing.text), "Reply sent").then(() => setEditing(null))}>
            Send edited reply
          </Button>
        </div>
      </div>
    ) : (
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" onClick={() => run("approve", () => approveDraft(conversation.id, m.id), "Reply sent")} loading={busy === "approve"}>
          <CheckCheck aria-hidden /> Approve & send
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing({ id: m.id, text: m.message })}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={() => run("discard", () => discardDraft(conversation.id, m.id), "Draft discarded")}>Discard</Button>
      </div>
    );

  return (
    <>
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{conversation.customerName}</p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            {CONVERSATION_CHANNEL_LABEL[conversation.channel]} <ConversationStatusBadge status={conversation.status} />
          </p>
        </div>
        <Button variant="outline" size="sm" className="xl:hidden" onClick={onDetails}>
          <Info aria-hidden /> Details
        </Button>
        {conversation.status !== "resolved" ? (
          <Button variant="ghost" size="sm" onClick={() => run("resolve", () => setConversationStatus(conversation.id, "resolved"), "Marked as resolved")}>
            Resolve
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => run("reopen", () => setConversationStatus(conversation.id, "seller_handling"), "Conversation reopened")}>
            Reopen
          </Button>
        )}
      </header>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2">
        <AIModeToggle
          value={conversation.aiMode}
          disabled={busy === "mode"}
          onChange={(mode: AIMode) => run("mode", () => setConversationMode(conversation.id, mode), `AI mode: ${AI_MODE_OPTIONS.find((o) => o.id === mode)?.label}`)}
        />
        <p className="text-xs text-muted-foreground">{modeLabel?.description}</p>
      </div>

      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto bg-background px-4 py-5">
        <ConversationThread messages={conversation.messages} productName={productName} renderDraftActions={draftActions} />
      </div>

      <form
        className="space-y-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <div className="flex items-end gap-2">
          <label htmlFor="seller-reply" className="sr-only">Reply as seller</label>
          <Textarea
            id="seller-reply"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Reply to ${conversation.customerName.split(" ")[0]}…`}
            className="min-h-11 flex-1 resize-none"
            rows={1}
          />
          <Button type="submit" size="icon" disabled={!text.trim() || busy === "send"} aria-label="Send reply">
            <SendHorizonal />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="soft"
            size="sm"
            disabled={conversation.aiMode === "human_only"}
            loading={busy === "draft"}
            onClick={() => run("draft", () => generateDraftReply(conversation.id), "AI draft ready for review")}
          >
            <Sparkles aria-hidden /> Suggest a reply
          </Button>
          <p className="text-[11px] text-muted-foreground">Enter to send · Shift+Enter for new line</p>
        </div>
      </form>
    </>
  );
}
