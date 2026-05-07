/**
 * 외부 서비스 키 통합 관리.
 *
 * 우선순위:
 *   1. Firestore: siteSettings/integrations 문서 (관리자가 어드민에서 입력)
 *   2. process.env (.env.local 폴백 — 부트스트랩용)
 *
 * 보안:
 *   - 이 파일은 서버 전용 (firebase-admin 사용)
 *   - integrations 문서는 Firestore Rules로 클라이언트 read 차단
 *   - 키 값을 클라이언트로 절대 반환하지 않음 (마스킹된 status만)
 */

import { adminDb } from "@/lib/firebase-admin";

export type IntegrationKey =
  | "geminiApiKey"
  | "smtpUser"
  | "smtpAppPassword"
  | "githubToken"
  | "githubRepo"
  | "googleSheetsInquiryId"
  | "googleSheetsServiceAccountEmail"
  | "googleSheetsServiceAccountPrivateKey"
  | "adminNotifyEmail"
  | "cronSecret"
  | "runmoaApiKey"
  | "runmoaBaseUrl";

const ENV_FALLBACK: Record<IntegrationKey, string> = {
  geminiApiKey: "GEMINI_API_KEY",
  smtpUser: "SMTP_USER",
  smtpAppPassword: "SMTP_APP_PASSWORD",
  githubToken: "GITHUB_TOKEN",
  githubRepo: "GITHUB_REPO",
  googleSheetsInquiryId: "GOOGLE_SHEETS_INQUIRY_SHEET_ID",
  googleSheetsServiceAccountEmail: "GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL",
  googleSheetsServiceAccountPrivateKey: "GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY",
  adminNotifyEmail: "ADMIN_NOTIFY_EMAIL",
  cronSecret: "CRON_SECRET",
  runmoaApiKey: "NEXT_PUBLIC_RUNMOA_API_KEY",
  runmoaBaseUrl: "NEXT_PUBLIC_RUNMOA_BASE_URL",
};

export const INTEGRATION_LABELS: Record<IntegrationKey, string> = {
  geminiApiKey: "Gemini API 키",
  smtpUser: "Gmail SMTP 계정",
  smtpAppPassword: "Gmail SMTP 앱 비밀번호",
  githubToken: "GitHub Personal Access Token",
  githubRepo: "GitHub 저장소 (owner/repo)",
  googleSheetsInquiryId: "문의 저장 스프레드시트 ID",
  googleSheetsServiceAccountEmail: "Service Account 이메일",
  googleSheetsServiceAccountPrivateKey: "Service Account Private Key",
  adminNotifyEmail: "관리자 알림 이메일",
  cronSecret: "Cron 보호 시크릿",
  runmoaApiKey: "런모아 API 키",
  runmoaBaseUrl: "런모아 베이스 URL",
};

const SECRET_KEYS: IntegrationKey[] = [
  "geminiApiKey",
  "smtpAppPassword",
  "githubToken",
  "googleSheetsServiceAccountPrivateKey",
  "cronSecret",
];

const CACHE_TTL = 60_000;
let _cache: { data: Partial<Record<IntegrationKey, string>>; ts: number } | null = null;

async function loadAll(): Promise<Partial<Record<IntegrationKey, string>>> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;
  let data: Partial<Record<IntegrationKey, string>> = {};
  try {
    const snap = await adminDb()
      .collection("siteSettings")
      .doc("integrations")
      .get();
    if (snap.exists) data = (snap.data() ?? {}) as typeof data;
  } catch {
    // ignore — fall back to env
  }
  _cache = { data, ts: Date.now() };
  return data;
}

export function invalidateIntegrationsCache() {
  _cache = null;
}

/**
 * 키 값을 가져온다. Firestore → env → "" 순.
 */
export async function getIntegration(key: IntegrationKey): Promise<string> {
  const all = await loadAll();
  const fromDb = all[key];
  if (fromDb && typeof fromDb === "string" && fromDb.length > 0) return fromDb;
  return process.env[ENV_FALLBACK[key]] ?? "";
}

/**
 * 어드민 UI용 — 어떤 키가 설정됐는지만 알려준다 (값 노출 X).
 */
export async function getIntegrationsStatus(): Promise<
  Record<IntegrationKey, { configured: boolean; source: "firestore" | "env" | "none"; preview?: string }>
> {
  const all = await loadAll();
  const result = {} as Record<
    IntegrationKey,
    { configured: boolean; source: "firestore" | "env" | "none"; preview?: string }
  >;
  for (const key of Object.keys(ENV_FALLBACK) as IntegrationKey[]) {
    const fromDb = all[key];
    const fromEnv = process.env[ENV_FALLBACK[key]];
    if (fromDb && fromDb.length > 0) {
      result[key] = {
        configured: true,
        source: "firestore",
        preview: SECRET_KEYS.includes(key) ? maskSecret(fromDb) : fromDb,
      };
    } else if (fromEnv && fromEnv.length > 0) {
      result[key] = {
        configured: true,
        source: "env",
        preview: SECRET_KEYS.includes(key) ? maskSecret(fromEnv) : fromEnv,
      };
    } else {
      result[key] = { configured: false, source: "none" };
    }
  }
  return result;
}

/**
 * 키 1개 또는 다수를 Firestore에 저장한다.
 * 빈 문자열이면 해당 필드를 삭제 (env fallback 사용으로 돌아감).
 */
export async function setIntegrations(
  partial: Partial<Record<IntegrationKey, string>>,
): Promise<void> {
  const ref = adminDb().collection("siteSettings").doc("integrations");
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(partial)) {
    if (v === undefined) continue;
    if (v === "") {
      // Firestore admin SDK FieldValue delete
      // dynamic require to avoid type complications
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { FieldValue } = require("firebase-admin/firestore");
      update[k] = FieldValue.delete();
    } else {
      update[k] = v;
    }
  }
  await ref.set(update, { merge: true });
  invalidateIntegrationsCache();
}

function maskSecret(value: string): string {
  if (value.length <= 6) return "•".repeat(value.length);
  return value.slice(0, 4) + "•".repeat(Math.min(20, value.length - 8)) + value.slice(-4);
}

export const ALL_INTEGRATION_KEYS: IntegrationKey[] = Object.keys(
  ENV_FALLBACK,
) as IntegrationKey[];

export function isSecretKey(k: IntegrationKey): boolean {
  return SECRET_KEYS.includes(k);
}
