import type { SiteConfig } from "@/types";
import { resetDb } from "@/lib/mock-data/store";
import { createId } from "@/lib/utils";
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

/** Mock upload: registers the file as a knowledge source awaiting approval. The file itself isn't stored. */
export function addKnowledgeSource(fileName: string) {
  return mutate((db) => {
    db.knowledgeSources.push({
      id: createId("ks"),
      name: fileName,
      type: "document",
      items: 1,
      approved: false,
      updatedAt: new Date().toISOString(),
    });
    return db.knowledgeSources;
  }, 800);
}

/** Clears every change made in this browser and restores the seed data. */
export async function resetDemoData() {
  resetDb();
}
