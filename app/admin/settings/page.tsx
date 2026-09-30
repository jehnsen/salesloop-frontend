"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { SiteConfig } from "@/types";
import { getAgentConfig } from "@/services/ai-agent";
import { getKnowledgeSources, getNotificationSettings, getSiteConfig, resetDemoData } from "@/services/settings";
import { useAsync } from "@/lib/hooks/use-async";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/states";
import { AdminPageHeader, PanelSkeleton } from "@/components/admin/primitives";
import {
  AISettingsSection,
  BusinessSection,
  ContactSection,
  DeliverySection,
  KnowledgeSection,
  LegalSection,
  NotificationSection,
  PaymentSection,
  SellerSection,
  SettingsCard,
  SocialSection,
  useConfigDraft,
} from "@/components/admin/settings-sections";

const NAV = [
  { id: "business", label: "Business profile" },
  { id: "seller", label: "Seller profile" },
  { id: "contact", label: "Contact information" },
  { id: "social", label: "Social channels" },
  { id: "delivery", label: "Delivery areas" },
  { id: "payments", label: "Payment methods" },
  { id: "ai", label: "AI settings" },
  { id: "notifications", label: "Notifications" },
  { id: "legal", label: "Legal / disclaimer" },
  { id: "knowledge", label: "Knowledge sources" },
  { id: "demo", label: "Demo data" },
];

const AUTONOMY_LABEL = { assist_only: "Assist Only", semi_automatic: "Semi-Automatic", automatic: "Automatic" } as const;

export default function SettingsPage() {
  const config = useAsync(getSiteConfig);
  const agent = useAsync(getAgentConfig);
  const notifications = useAsync(getNotificationSettings);
  const knowledge = useAsync(getKnowledgeSources);

  if (config.loading || notifications.loading || knowledge.loading || agent.loading) {
    return <div className="grid gap-6"><PanelSkeleton /><PanelSkeleton /></div>;
  }
  if (config.error || !config.data) return <ErrorState action={<Button onClick={() => config.reload()}>Retry</Button>} />;

  return (
    <SettingsContent
      config={config.data}
      onConfig={(c) => config.setData(c)}
      agentActive={agent.data?.active ?? true}
      autonomyLabel={AUTONOMY_LABEL[agent.data?.autonomy ?? "semi_automatic"]}
      notifications={notifications.data ?? []}
      onNotifications={(n) => notifications.setData(n)}
      knowledge={knowledge.data ?? []}
      onKnowledge={(k) => knowledge.setData(k)}
    />
  );
}

function SettingsContent(props: {
  config: SiteConfig;
  onConfig: (c: SiteConfig) => void;
  agentActive: boolean;
  autonomyLabel: string;
  notifications: NonNullable<Awaited<ReturnType<typeof getNotificationSettings>>>;
  onNotifications: (n: NonNullable<Awaited<ReturnType<typeof getNotificationSettings>>>) => void;
  knowledge: NonNullable<Awaited<ReturnType<typeof getKnowledgeSources>>>;
  onKnowledge: (k: NonNullable<Awaited<ReturnType<typeof getKnowledgeSources>>>) => void;
}) {
  const d = useConfigDraft(props.config, props.onConfig);
  const [resetOpen, setResetOpen] = React.useState(false);

  return (
    <>
      <AdminPageHeader title="Settings" description="Your store, seller details, delivery, AI, and compliance settings." />
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-24 grid gap-0.5 text-sm">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">{n.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid max-w-3xl gap-6">
          <BusinessSection d={d} />
          <SellerSection d={d} />
          <ContactSection d={d} />
          <SocialSection d={d} />
          <DeliverySection d={d} />
          <PaymentSection d={d} />
          <AISettingsSection active={props.agentActive} autonomyLabel={props.autonomyLabel} />
          <NotificationSection settings={props.notifications} onChange={props.onNotifications} />
          <LegalSection d={d} />
          <KnowledgeSection sources={props.knowledge} onChange={props.onKnowledge} />
          <SettingsCard id="demo" title="Demo data" description="This frontend runs on mock data stored in your browser.">
            <p className="text-sm text-muted-foreground">
              Leads captured in the customer chat, order inquiries, and your changes here are saved in this browser only. Reset to restore the original sample data.
            </p>
            <Button variant="outline" className="justify-self-start text-destructive hover:bg-danger-soft" onClick={() => setResetOpen(true)}>
              <RotateCcw aria-hidden /> Reset demo data
            </Button>
          </SettingsCard>
        </div>
      </div>
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset demo data?"
        description="All changes made in this browser will be cleared."
        confirmLabel="Reset data"
        destructive
        onConfirm={async () => {
          await resetDemoData();
          toast.success("Demo data restored");
          window.location.reload();
        }}
      />
    </>
  );
}
