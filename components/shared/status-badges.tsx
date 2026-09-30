import { AlertTriangle, Flame, HeartPulse, Sparkles } from "lucide-react";
import type {
  AIIntent,
  CampaignStatus,
  ContentStatus,
  ConversationStatus,
  CustomerStatus,
  FollowUpStatus,
  OrderStatus,
  PipelineStage,
  PurchaseIntent,
  ReorderLikelihood,
  StockStatus,
} from "@/types";
import {
  CAMPAIGN_STATUS_LABEL,
  CONTENT_STATUSES,
  CONVERSATION_STATUS_LABEL,
  CUSTOMER_STATUS_LABEL,
  INTENT_LABEL,
  ORDER_STATUS_LABEL,
  STAGE_LABEL,
  STOCK_LABEL,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

/** Every status pill in the app. Colour is never the only signal: each has a text label. */

export function LeadScoreBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 80 ? "text-success bg-success-soft" : score >= 50 ? "text-warning bg-warning-soft" : "text-muted-foreground bg-muted";
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", tone, className)}
      aria-label={`Lead score ${score} out of 100`}
    >
      {score >= 80 && <Flame className="size-3" aria-hidden />}
      {score}
    </span>
  );
}

const PURCHASE_VARIANT: Record<PurchaseIntent, BadgeVariant> = { high: "success", medium: "warning", low: "neutral" };

export function PurchaseIntentBadge({ intent }: { intent: PurchaseIntent }) {
  return (
    <Badge variant={PURCHASE_VARIANT[intent]} dot>
      {intent[0].toUpperCase() + intent.slice(1)} intent
    </Badge>
  );
}

export function IntentBadge({ intent }: { intent: AIIntent }) {
  const variant: BadgeVariant =
    intent === "medical_question" || intent === "complaint"
      ? "danger"
      : intent === "buy_product" || intent === "reorder"
        ? "success"
        : intent === "human_handoff"
          ? "warning"
          : "info";
  return (
    <Badge variant={variant}>
      {intent === "medical_question" && <HeartPulse aria-hidden />}
      {intent === "complaint" && <AlertTriangle aria-hidden />}
      {INTENT_LABEL[intent]}
    </Badge>
  );
}

const STAGE_VARIANT: Record<PipelineStage, BadgeVariant> = {
  new: "neutral",
  engaged: "info",
  qualified: "brand",
  interested: "coffee",
  order_inquiry: "warning",
  converted: "success",
  lost: "danger",
};

export function PipelineStageBadge({ stage }: { stage: PipelineStage }) {
  return <Badge variant={STAGE_VARIANT[stage]}>{STAGE_LABEL[stage]}</Badge>;
}

const ORDER_VARIANT: Record<OrderStatus, BadgeVariant> = {
  inquiry: "info",
  pending_confirmation: "warning",
  confirmed: "brand",
  preparing: "coffee",
  ready_for_delivery: "coffee",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={ORDER_VARIANT[status]} dot>
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}

const STOCK_VARIANT: Record<StockStatus, BadgeVariant> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "neutral",
  pre_order: "info",
};

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  return (
    <Badge variant={STOCK_VARIANT[status]} dot className={className}>
      {STOCK_LABEL[status]}
    </Badge>
  );
}

const CUSTOMER_VARIANT: Record<CustomerStatus, BadgeVariant> = { active: "success", vip: "brand", at_risk: "warning", inactive: "neutral" };

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <Badge variant={CUSTOMER_VARIANT[status]}>{CUSTOMER_STATUS_LABEL[status]}</Badge>;
}

const LIKELIHOOD_VARIANT: Record<ReorderLikelihood, BadgeVariant> = { high: "success", medium: "warning", low: "neutral" };

export function LikelihoodBadge({ likelihood }: { likelihood: ReorderLikelihood }) {
  return (
    <Badge variant={LIKELIHOOD_VARIANT[likelihood]} dot>
      {likelihood[0].toUpperCase() + likelihood.slice(1)} likelihood
    </Badge>
  );
}

const CONVERSATION_VARIANT: Record<ConversationStatus, BadgeVariant> = {
  ai_handling: "brand",
  needs_seller: "danger",
  seller_handling: "info",
  resolved: "neutral",
};

export function ConversationStatusBadge({ status }: { status: ConversationStatus }) {
  return (
    <Badge variant={CONVERSATION_VARIANT[status]}>
      {status === "ai_handling" && <Sparkles aria-hidden />}
      {CONVERSATION_STATUS_LABEL[status]}
    </Badge>
  );
}

const CONTENT_VARIANT: Record<ContentStatus, BadgeVariant> = { idea: "neutral", draft: "warning", approved: "info", published: "success" };

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return <Badge variant={CONTENT_VARIANT[status]}>{CONTENT_STATUSES.find((s) => s.id === status)?.label}</Badge>;
}

const CAMPAIGN_VARIANT: Record<CampaignStatus, BadgeVariant> = { active: "success", paused: "warning", draft: "neutral", completed: "info" };

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <Badge variant={CAMPAIGN_VARIANT[status]} dot>
      {CAMPAIGN_STATUS_LABEL[status]}
    </Badge>
  );
}

const FOLLOW_UP_VARIANT: Record<FollowUpStatus, BadgeVariant> = { scheduled: "info", completed: "success", skipped: "neutral" };

export function FollowUpStatusBadge({ status, overdue }: { status: FollowUpStatus; overdue?: boolean }) {
  if (overdue && status === "scheduled") {
    return (
      <Badge variant="danger" dot>
        Overdue
      </Badge>
    );
  }
  return <Badge variant={FOLLOW_UP_VARIANT[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

export function AIBadge({ label = "AI", className }: { label?: string; className?: string }) {
  return (
    <Badge variant="brand" className={className}>
      <Sparkles aria-hidden />
      {label}
    </Badge>
  );
}
