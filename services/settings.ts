import type { SiteConfig } from "@/types";
import { resetDb } from "@/lib/mock-data/store";
import { mutate, query } from "./_mock";

export function getSiteConfig() {
  return query((db) => db.siteConfig);
}

export function updateSiteConfig(patch: Partial<SiteConfig>) {
  return mutate((db) => Object.assign(db.siteConfig, patch));
}

export function getNotificationSettings() {
  return query((db) => db.notificationSettings);
}

export function updateNotificationSetting(id: string, channel: "email" | "push", value: boolean) {
  return mutate((db) => {
    const setting = db.notificationSettings.find((n) => n.id === id);
    if (setting) setting[channel] = value;
    return db.notificationSettings;
  }, 100);
}

export function getKnowledgeSources() {
  return query((db) => db.knowledgeSources);
}

export function setKnowledgeSourceApproved(id: string, approved: boolean) {
  return mutate((db) => {
    const source = db.knowledgeSources.find((k) => k.id === id);
    if (source) source.approved = approved;
    return db.knowledgeSources;
  }, 150);
}

/** Clears every change made in this browser and restores the seed data. */
export async function resetDemoData() {
  resetDb();
}
