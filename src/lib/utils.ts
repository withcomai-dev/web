import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export function formatDate(input: string | Date | number): string {
  const d = typeof input === "string" || typeof input === "number" ? new Date(input) : input;
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

/** Firestore Timestamp·ISO 문자열·숫자·Date 어떤 형태든 Date로 정규화. 깨진 값은 null. */
export function toDateSafe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object") {
    const v = value as { toDate?: () => Date; seconds?: number };
    if (typeof v.toDate === "function") return v.toDate();
    if (typeof v.seconds === "number") return new Date(v.seconds * 1000);
  }
  return null;
}

/** 접수·기록 시각 표시용 — serverTimestamp(Timestamp 객체)로 저장된 문서도 안전하게 일시 문자열로. */
export function formatDateTime(value: unknown): string {
  const d = toDateSafe(value);
  return d ? d.toLocaleString("ko-KR") : "—";
}

export function htmlToPlainTextSummary(html: string, max = 140): string {
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
