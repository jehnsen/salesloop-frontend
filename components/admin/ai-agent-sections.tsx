"use client";

import * as React from "react";
import Link from "next/link";
import { FlaskConical, RotateCcw, SendHorizonal } from "lucide-react";
import type { AIActivity, AIActivityStatus, ChatAttachment } from "@/types";
import { initialSessionState, previewAgentReply, type ChatSessionState } from "@/services/ai-agent";
import { AI_ACTIVITY_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { AIAvatar } from "@/components/chat/chat-primitives";
import { DataTable } from "@/components/shared/data-table";
import { AnalysisChips } from "./conversation-parts";
import { Panel } from "./primitives";

const SAMPLES = [
  "Magkano Lingzhi Coffee? Maybe kukuha ako tatlo.",
  "Ano difference ng black coffee at 3-in-1?",
  "Pwede ba ang RG sa may diabetes?",
  "Gusto ko ng refund, sira yung box",
];

interface Turn {
  id: number;
  text: string;
  reply: Awaited<ReturnType<typeof previewAgentReply>>;
}

function attachmentLabel(a: ChatAttachment) {
  switch (a.type) {
    case "product_cards": return `Product cards (${a.productSlugs.length})`;
    case "comparison": return "Comparison table";
    case "lead_form": return "Lead capture form";
    case "order_link": return "Order inquiry link";
    case "handoff": return "Seller handoff";
    case "medical_notice": return "Medical notice";
  }
}

/** Sandbox for trying the agent with the current settings. Nothing is saved. */
export function AgentPlayground({ productName }: { productName: (slug?: string) => string }) {
  const [text, setText] = React.useState("");
  const [state, setState] = React.useState<ChatSessionState>(initialSessionState);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [pending, setPending] = React.useState(false);

  async function send(message: string) {
    if (!message.trim() || pending) return;
    setPending(true);
    setText("");
    try {
      const reply = await previewAgentReply(message.trim(), state);
      setState(reply.state);
      setTurns((t) => [...t, { id: Date.now(), text: message.trim(), reply }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel
      title={<span className="flex items-center gap-2"><FlaskConical className="size-4 text-leaf" aria-hidden /> Test the assistant</span>}
      description="Try customer messages against your current settings. Nothing is saved or sent."
      action={
        turns.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setTurns([]); setState(initialSessionState); }}>
            <RotateCcw aria-hidden /> Reset
          </Button>
        )
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button key={s} type="button" onClick={() => send(s)} disabled={pending} className="rounded-full border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>
      <div className="max-h-[28rem] space-y-4 overflow-y-auto" aria-live="polite">
        {turns.map((t) => (
          <div key={t.id} className="space-y-2 rounded-xl border p-3">
            <p className="text-sm"><span className="font-medium">Customer:</span> {t.text}</p>
            <AnalysisChips analysis={t.reply.analysis} productName={productName} />
            <div className="flex gap-2">
              <AIAvatar size="sm" />
              <div className="space-y-1.5">
                <p className="rounded-2xl rounded-tl-md bg-primary-soft/60 px-3 py-2 text-sm">{t.reply.message}</p>
                {t.reply.attachments.length > 0 && (
                  <p className="text-xs text-muted-foreground">Shows: {t.reply.attachments.map(attachmentLabel).join(" · ")}</p>
                )}
              </div>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Structured output (JSON)</summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono">{JSON.stringify(t.reply.analysis, null, 2)}</pre>
            </details>
          </div>
        ))}
        {pending && <p className="text-sm text-muted-foreground">Thinking…</p>}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <label htmlFor="playground-input" className="sr-only">Test message</label>
        <Input id="playground-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a customer message…" />
        <Button type="submit" size="icon" disabled={!text.trim() || pending} aria-label="Send test message"><SendHorizonal /></Button>
      </form>
    </Panel>
  );
}

const STATUS_VARIANT: Record<AIActivityStatus, BadgeVariant> = {
  completed: "success",
  pending_approval: "warning",
  escalated: "danger",
  blocked: "neutral",
};
const STATUS_LABEL: Record<AIActivityStatus, string> = {
  completed: "Completed",
  pending_approval: "Needs approval",
  escalated: "Escalated",
  blocked: "Blocked",
};

export function ActivityLogTable({ items, loading }: { items: AIActivity[]; loading: boolean }) {
  const [type, setType] = React.useState<AIActivity["type"] | "all">("all");
  const rows = items.filter((a) => type === "all" || a.type === type);
  return (
    <Panel
      title="Agent activity log"
      description="Every action the AI took, with a short reasoning summary."
      action={
        <NativeSelect aria-label="Filter by action" value={type} onChange={(e) => setType(e.target.value as typeof type)} className="h-9 w-48">
          <option value="all">All actions</option>
          {Object.entries(AI_ACTIVITY_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </NativeSelect>
      }
      contentClassName="p-0 sm:p-0"
    >
      <DataTable
        className="[&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none"
        loading={loading}
        rows={rows}
        rowKey={(a) => a.id}
        caption="Agent activity log"
        empty={{ title: "No activity for this filter" }}
        columns={[
          { key: "time", header: "Time", cell: (a) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(a.timestamp)}</span> },
          {
            key: "customer",
            header: "Customer",
            cell: (a) =>
              a.leadId || a.customerId ? (
                <Link href={a.leadId ? `/admin/leads/${a.leadId}` : `/admin/customers/${a.customerId}`} className="whitespace-nowrap hover:underline">{a.customerName}</Link>
              ) : (
                <span className="whitespace-nowrap">{a.customerName}</span>
              ),
          },
          { key: "action", header: "Action", cell: (a) => <span className="font-medium">{a.action}</span> },
          { key: "reason", header: "Reasoning summary", cell: (a) => <span className="line-clamp-2 min-w-56 text-muted-foreground">{a.reasoning}</span> },
          { key: "result", header: "Result", cell: (a) => <span className="min-w-40">{a.result}</span> },
          { key: "status", header: "Status", cell: (a) => <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge> },
        ]}
        mobileCard={(a) => (
          <div className="border-b p-4 last:border-b-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{a.action}</p>
              <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{a.customerName} · {formatDateTime(a.timestamp)}</p>
            <p className="mt-1 text-sm">{a.reasoning}</p>
          </div>
        )}
      />
    </Panel>
  );
}
