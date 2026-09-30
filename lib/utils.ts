import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TIME_ZONE = "Asia/Manila";
const LOCALE = "en-PH";

const pesoFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatPeso(value: number) {
  return pesoFormatter.format(value);
}

export function formatCompactPeso(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(1)}k`;
  return formatPeso(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(LOCALE).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...opts }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return formatDate(iso, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatTime(iso: string) {
  return formatDate(iso, { hour: "numeric", minute: "2-digit" });
}

/** Short relative label: "just now", "12m ago", "3h ago", "2d ago", or a date. */
export function timeAgo(iso: string, now: number = Date.now()) {
  const diff = now - new Date(iso).getTime();
  const future = diff < 0;
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60_000);
  if (minutes < 1) return "just now";
  const wrap = (s: string) => (future ? `in ${s}` : `${s} ago`);
  if (minutes < 60) return wrap(`${minutes}m`);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return wrap(`${hours}h`);
  const days = Math.round(hours / 24);
  if (days < 30) return wrap(`${days}d`);
  return formatDate(iso);
}

/** Calendar-day difference in Manila time (0 = today, 1 = tomorrow, -1 = yesterday). */
export function dayOffset(iso: string, now: Date = new Date()) {
  const key = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
  const a = new Date(key(new Date(iso)));
  const b = new Date(key(now));
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function friendlyDay(iso: string) {
  const offset = dayOffset(iso);
  if (offset === 0) return `Today, ${formatTime(iso)}`;
  if (offset === 1) return `Tomorrow, ${formatTime(iso)}`;
  if (offset === -1) return `Yesterday, ${formatTime(iso)}`;
  return formatDateTime(iso);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function createId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}

/** Philippine mobile number: 09XXXXXXXXX or +639XXXXXXXXX (spaces/dashes allowed). */
export function isValidPHMobile(value: string) {
  const digits = value.replace(/[\s-]/g, "");
  return /^(09\d{9}|\+639\d{9})$/.test(digits);
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
