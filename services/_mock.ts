import { getDb, persistDb, type MockDatabase } from "@/lib/mock-data/store";
import { sleep } from "@/lib/utils";

/**
 * Shared helpers for the mock service layer.
 *
 * Every service function is async and returns cloned data, exactly like a real
 * HTTP client would. Replace the bodies with `fetch(`${API_BASE}/...`)` calls when
 * the Node.js/PostgreSQL backend is ready; component code will not need to change.
 */

const isServer = typeof window === "undefined";

function latency(ms?: number) {
  if (isServer) return 40;
  return ms ?? 250 + Math.round(Math.random() * 300);
}

/** Read from the mock DB with simulated network latency. */
export async function query<T>(select: (db: MockDatabase) => T, ms?: number): Promise<T> {
  await sleep(latency(ms));
  return structuredClone(select(getDb()));
}

/** Write to the mock DB, persist (browser only), and return a cloned result. */
export async function mutate<T>(apply: (db: MockDatabase) => T, ms?: number): Promise<T> {
  await sleep(latency(ms));
  const result = apply(getDb());
  persistDb();
  return structuredClone(result);
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export function must<T>(value: T | undefined, entity: string, id: string): T {
  if (value === undefined) throw new NotFoundError(entity, id);
  return value;
}

export function nowIso() {
  return new Date().toISOString();
}
