import type { Campaign, CampaignStatus } from "@/types";
import { createId } from "@/lib/utils";
import { must, mutate, nowIso, query } from "./_mock";

export function getCampaigns() {
  const order: Record<CampaignStatus, number> = { active: 0, paused: 1, draft: 2, completed: 3 };
  return query((db) => [...db.campaigns].sort((a, b) => order[a.status] - order[b.status]));
}

export function getCampaignById(id: string) {
  return query((db) => db.campaigns.find((c) => c.id === id) ?? null);
}

export function updateCampaignStatus(id: string, status: CampaignStatus) {
  return mutate((db) => {
    const campaign = must(db.campaigns.find((c) => c.id === id), "Campaign", id);
    campaign.status = status;
    return campaign;
  });
}

export type CreateCampaignInput = Pick<Campaign, "name" | "objective" | "productSlugs" | "targetAudience" | "channels">;

export function createCampaign(input: CreateCampaignInput) {
  return mutate((db) => {
    const campaign: Campaign = {
      ...input,
      id: createId("cmp"),
      status: "draft",
      startDate: nowIso(),
      funnel: { impressions: 0, visits: 0, conversations: 0, leads: 0, orders: 0 },
      estimatedRevenue: 0,
    };
    db.campaigns.unshift(campaign);
    return campaign;
  });
}
