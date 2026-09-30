/**
 * Mock authentication (frontend-only). Replace with real sessions when the backend exists;
 * the session lives in localStorage so it survives reloads but never leaves the browser.
 */
export const SAMPLE_CREDENTIALS = { email: "admin@salesloop.com", password: "Salesloop@2026" } as const;

const SESSION_KEY = "salesloop.session";

export interface Session {
  email: string;
  name: string;
  signedInAt: string;
}

export function getSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<Session> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (email.trim().toLowerCase() !== SAMPLE_CREDENTIALS.email || password !== SAMPLE_CREDENTIALS.password) {
    throw new Error("Incorrect email or password.");
  }
  const session: Session = { email: SAMPLE_CREDENTIALS.email, name: "Rhea Bautista", signedInAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    throw new Error("Your browser blocked saving the session. Enable site storage and try again.");
  }
  return session;
}

export function logout() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to clear */
  }
}
