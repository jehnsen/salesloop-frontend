"use client";

import * as React from "react";
import { Bot, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { AIAgentConfig, AIAutonomyLevel, AIGuardrail } from "@/types";
import { getAgentConfig, getAIActivity, setCapability, setGuardrail, updateAgentConfig } from "@/services/ai-agent";
import { useAsync, useDbChange } from "@/lib/hooks/use-async";
import { useProductLookup } from "@/lib/hooks/use-products";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/states";
import { ActivityLogTable, AgentPlayground } from "@/components/admin/ai-agent-sections";
import { AdminPageHeader, Panel, PanelSkeleton } from "@/components/admin/primitives";

const AUTONOMY: { id: AIAutonomyLevel; title: string; description: string; examples: string }[] = [
  {
    id: "assist_only",
    title: "Assist Only",
    description: "AI drafts responses but you approve every message.",
    examples: "Best when you want full control.",
  },
  {
    id: "semi_automatic",
    title: "Semi-Automatic",
    description: "AI handles simple inquiries but you approve sales actions.",
    examples: "Answers product questions; you confirm orders, promos, and follow-ups.",
  },
  {
    id: "automatic",
    title: "Automatic",
    description: "AI handles approved actions automatically.",
    examples: "Sends follow-ups and order summaries within your guardrails.",
  },
];

export default function AIAgentPage() {
  const config = useAsync(getAgentConfig);
  const activity = useAsync(() => getAIActivity());
  const { name } = useProductLookup();
  const [pendingGuardrail, setPendingGuardrail] = React.useState<AIGuardrail | null>(null);
  const [pauseOpen, setPauseOpen] = React.useState(false);
  const [greeting, setGreeting] = React.useState("");
  const [language, setLanguage] = React.useState<AIAgentConfig["responseLanguage"]>("auto");
  useDbChange(() => void activity.reload({ silent: true }));

  React.useEffect(() => {
    if (config.data) {
      setGreeting(config.data.greeting);
      setLanguage(config.data.responseLanguage);
    }
  }, [config.data]);

  if (config.loading) return <div className="grid gap-6"><PanelSkeleton /><PanelSkeleton rows={6} /></div>;
  if (config.error || !config.data) return <ErrorState action={<Button onClick={() => config.reload()}>Retry</Button>} />;
  const c = config.data;

  const today = (activity.data ?? []).filter((a) => Date.now() - new Date(a.timestamp).getTime() < 86_400_000);
  const stats = [
    { label: "Actions today", value: today.length },
    { label: "Leads captured", value: today.filter((a) => a.type === "captured_lead").length },
    { label: "Escalated to you", value: today.filter((a) => a.status === "escalated").length },
    { label: "Awaiting approval", value: (activity.data ?? []).filter((a) => a.status === "pending_approval").length },
  ];

  async function save(patch: Parameters<typeof updateAgentConfig>[0], message: string) {
    config.setData(await updateAgentConfig(patch));
    toast.success(message);
  }

  async function toggleGuardrail(g: AIGuardrail, enabled: boolean) {
    if (!enabled && g.critical) return setPendingGuardrail(g);
    config.setData(await setGuardrail(g.id, enabled));
    toast.success(`${g.label}: ${enabled ? "on" : "off"}`);
  }

  return (
    <>
      <AdminPageHeader title="AI Agent Control Center" description="Decide what your AI Sales Assistant can do, and how much it can do on its own." />

      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-2xl", c.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            <Bot className="size-7" aria-hidden />
          </span>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <Badge variant={c.active ? "success" : "neutral"} dot>{c.active ? "Active" : "Paused"}</Badge>
              <Badge variant="brand">{AUTONOMY.find((a) => a.id === c.autonomy)?.title}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {c.active ? "Answering customers on the website chat and Messenger, 24/7." : "Paused. Customer messages go straight to you."}
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium">
            {c.active ? "Agent on" : "Agent off"}
            <Switch
              checked={c.active}
              onCheckedChange={(on) => (on ? void save({ active: true }, "AI assistant resumed") : setPauseOpen(true))}
              aria-label="AI assistant active"
            />
          </label>
        </div>
        <dl className="grid grid-cols-2 border-t sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="border-r p-4 last:border-r-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r">
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="text-xl font-semibold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Capabilities" description="Turn individual skills on or off.">
          <ul className="grid gap-3 sm:grid-cols-2">
            {c.capabilities.map((cap) => (
              <li key={cap.id}>
                <label className={cn("flex h-full items-start justify-between gap-3 rounded-xl border p-3.5 transition-colors", cap.enabled ? "bg-card" : "bg-muted/40")}>
                  <span>
                    <span className="block text-sm font-medium">{cap.label}</span>
                    <span className="block text-xs text-muted-foreground">{cap.description}</span>
                  </span>
                  <Switch
                    checked={cap.enabled}
                    onCheckedChange={async (on) => {
                      config.setData(await setCapability(cap.id, on));
                      toast.success(`${cap.label} ${on ? "enabled" : "disabled"}`);
                    }}
                    aria-label={cap.label}
                  />
                </label>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="AI autonomy level" description="How much the assistant can do without your approval.">
          <RadioGroup
            value={c.autonomy}
            onValueChange={(v) => void save({ autonomy: v as AIAutonomyLevel }, `Autonomy set to ${AUTONOMY.find((a) => a.id === v)?.title}`)}
            className="gap-3"
            aria-label="AI autonomy level"
          >
            {AUTONOMY.map((a, i) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-soft/40"
              >
                <RadioGroupItem value={a.id} className="mt-0.5" />
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {i + 1}. {a.title}
                    {a.id === "semi_automatic" && <Badge variant="neutral">Recommended</Badge>}
                  </span>
                  <span className="block text-sm">{a.description}</span>
                  <span className="block text-xs text-muted-foreground">{a.examples}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </Panel>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel
          title={<span className="flex items-center gap-2"><ShieldCheck className="size-4 text-leaf" aria-hidden /> AI guardrails</span>}
          description="Rules the assistant always follows. Locked rules protect you from compliance issues."
        >
          <ul className="divide-y">
            {c.guardrails.map((g) => (
              <li key={g.id}>
                <label className="flex items-start justify-between gap-4 py-3">
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {g.label} {g.critical && <Lock className="size-3 text-muted-foreground" aria-label="Critical guardrail" />}
                    </span>
                    <span className="block text-xs text-muted-foreground">{g.description}</span>
                  </span>
                  <Switch checked={g.enabled} onCheckedChange={(on) => void toggleGuardrail(g, on)} aria-label={g.label} />
                </label>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Assistant behavior">
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="greeting" className="text-sm font-medium">Greeting message</label>
              <Textarea id="greeting" value={greeting} onChange={(e) => setGreeting(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="language" className="text-sm font-medium">Response language</label>
              <NativeSelect id="language" value={language} onChange={(e) => setLanguage(e.target.value as typeof language)}>
                <option value="auto">Match the customer (English, Filipino, or Taglish)</option>
                <option value="english">Always English</option>
                <option value="taglish">Taglish</option>
              </NativeSelect>
            </div>
            <Button
              className="justify-self-start"
              disabled={greeting === c.greeting && language === c.responseLanguage}
              onClick={() => void save({ greeting: greeting.trim() || c.greeting, responseLanguage: language }, "Assistant behavior saved")}
            >
              Save changes
            </Button>
          </div>
        </Panel>
      </div>

      <div className="mb-6">
        <AgentPlayground productName={name} />
      </div>

      <ActivityLogTable items={activity.data ?? []} loading={activity.loading} />

      <ConfirmDialog
        open={Boolean(pendingGuardrail)}
        onOpenChange={(o) => !o && setPendingGuardrail(null)}
        title={`Turn off “${pendingGuardrail?.label}”?`}
        description="This is a critical guardrail. Turning it off may allow responses that are non-compliant or inaccurate. We strongly recommend keeping it on."
        confirmLabel="Turn off anyway"
        cancelLabel="Keep it on"
        destructive
        onConfirm={async () => {
          if (!pendingGuardrail) return;
          config.setData(await setGuardrail(pendingGuardrail.id, false));
          toast.warning(`${pendingGuardrail.label} is now off`);
        }}
      />
      <ConfirmDialog
        open={pauseOpen}
        onOpenChange={setPauseOpen}
        title="Pause the AI assistant?"
        description="Customers can still message you, but the assistant won't reply. Their messages will wait in your inbox."
        confirmLabel="Pause assistant"
        destructive
        onConfirm={() => save({ active: false }, "AI assistant paused")}
      />
    </>
  );
}
