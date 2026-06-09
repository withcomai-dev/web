"use client";
import { authedFetch } from "@/lib/authed-fetch";

import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  KeyRound,
  Lock,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminTableShell";
import { cn } from "@/lib/utils";

type IntegrationKey =
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

interface KeyMeta {
  key: IntegrationKey;
  label: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  secret?: boolean;
  group: string;
}

const META: KeyMeta[] = [
  {
    group: "AI",
    key: "geminiApiKey",
    label: "Gemini API 키",
    placeholder: "AIza...",
    hint: "https://aistudio.google.com/app/apikey",
    secret: true,
  },
  {
    group: "메일 (Gmail SMTP)",
    key: "smtpUser",
    label: "Gmail 주소",
    placeholder: "your@gmail.com",
    hint: "발신 계정",
  },
  {
    group: "메일 (Gmail SMTP)",
    key: "smtpAppPassword",
    label: "앱 비밀번호 (16자리)",
    placeholder: "abcd efgh ijkl mnop",
    hint: "Google 계정 보안 → 앱 비밀번호 발급",
    secret: true,
  },
  {
    group: "메일 (Gmail SMTP)",
    key: "adminNotifyEmail",
    label: "관리자 알림 이메일",
    placeholder: "withcom7@naver.com",
    hint: "신규 문의·신고 시 알림 받을 주소",
  },
  {
    group: "GitHub",
    key: "githubRepo",
    label: "GitHub 저장소",
    placeholder: "owner/repo",
    hint: "예: withcomai-dev/web",
  },
  {
    group: "GitHub",
    key: "githubToken",
    label: "Personal Access Token",
    placeholder: "ghp_...",
    hint: "repo scope 필요",
    secret: true,
  },
  {
    group: "Google Sheets (문의 자동 저장)",
    key: "googleSheetsInquiryId",
    label: "스프레드시트 ID",
    placeholder: "1abc...XYZ",
    hint: "스프레드시트 URL의 /d/ 다음 부분",
  },
  {
    group: "Google Sheets (문의 자동 저장)",
    key: "googleSheetsServiceAccountEmail",
    label: "Service Account 이메일",
    placeholder: "name@project.iam.gserviceaccount.com",
    hint: "GCP 콘솔에서 발급. 스프레드시트 공유 필요",
  },
  {
    group: "Google Sheets (문의 자동 저장)",
    key: "googleSheetsServiceAccountPrivateKey",
    label: "Service Account Private Key",
    placeholder: "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
    hint: "JSON 파일의 private_key 필드 값을 그대로 붙여넣기",
    secret: true,
    multiline: true,
  },
  {
    group: "런모아",
    key: "runmoaApiKey",
    label: "런모아 API 키",
    placeholder: "Bearer 토큰 또는 빈값(익명)",
    hint: "비워두면 익명 호출",
  },
  {
    group: "런모아",
    key: "runmoaBaseUrl",
    label: "런모아 베이스 URL",
    placeholder: "https://aish.runmoa.com",
  },
  {
    group: "기타",
    key: "cronSecret",
    label: "Cron 보호 시크릿",
    placeholder: "임의 문자열",
    hint: "/api/cron/* 호출 시 ?token= 또는 X-Cron-Secret 헤더 검증",
    secret: true,
  },
];

interface KeyStatus {
  configured: boolean;
  source: "firestore" | "env" | "none";
  preview?: string;
}

export default function AdminIntegrationsPage() {
  const [status, setStatus] = useState<Record<IntegrationKey, KeyStatus> | null>(null);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Partial<Record<IntegrationKey, string>>>({});
  const [reveal, setReveal] = useState<Partial<Record<IntegrationKey, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authedFetch("/api/admin/integrations");
      if (!res.ok) throw new Error(`조회 실패 (${res.status})`);
      const data = await res.json();
      setStatus(data.status);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (Object.keys(edits).length === 0) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await authedFetch("/api/admin/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edits),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `저장 실패 (${res.status})`);
      setStatus(data.status);
      setEdits({});
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const clearKey = async (key: IntegrationKey) => {
    if (!confirm(`${key} 값을 지우고 .env 폴백으로 돌아가시겠습니까?`)) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await authedFetch("/api/admin/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `삭제 실패`);
      setStatus(data.status);
      setEdits((e) => {
        const n = { ...e };
        delete n[key];
        return n;
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setSaving(false);
    }
  };

  const groups: Record<string, KeyMeta[]> = {};
  for (const m of META) {
    (groups[m.group] ??= []).push(m);
  }

  return (
    <div>
      <AdminPageHeader
        title="외부 서비스 키"
        description="AI·메일·GitHub·런모아 등의 키를 직접 관리합니다. 코드 수정·재배포 없이 즉시 반영됩니다."
        onRefresh={load}
        extra={
          <div className="flex gap-2">
            {savedAt && (
              <span className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg">
                <CheckCircle2 className="w-4 h-4" /> 저장됨
              </span>
            )}
            <button
              onClick={save}
              disabled={saving || Object.keys(edits).length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              변경사항 저장 ({Object.keys(edits).length})
            </button>
          </div>
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3 text-sm">
        <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900 mb-1">보안 안내</p>
          <ul className="text-amber-800 space-y-0.5 list-disc pl-4">
            <li>저장된 키는 Firestore에 암호화되어 보관되며 클라이언트 SDK에서 절대 읽히지 않습니다.</li>
            <li>API 라우트(서버)에서만 Admin SDK로 접근합니다.</li>
            <li>입력값은 .env 파일보다 우선 적용됩니다. 빈 값으로 저장하면 .env 값으로 돌아갑니다.</li>
            <li>Firebase 클라이언트 설정(NEXT_PUBLIC_*)은 빌드 시점에 결정되어 여기서 변경할 수 없습니다.</li>
          </ul>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : err ? (
        <p className="text-rose-600 py-10 text-center">{err}</p>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {Object.entries(groups).map(([group, items]) => (
            <section key={group} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <header className="px-5 py-3 bg-gray-50 border-b border-gray-100 font-semibold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-gray-500" /> {group}
              </header>
              <div className="p-5 space-y-4">
                {items.map((m) => {
                  const st = status?.[m.key] ?? { configured: false, source: "none" as const };
                  const draft = edits[m.key];
                  const isEditing = draft !== undefined;
                  const visible = reveal[m.key];

                  return (
                    <div key={m.key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          {m.label}
                        </label>
                        <div className="flex items-center gap-2 text-xs">
                          {st.configured ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold",
                                st.source === "firestore"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-blue-100 text-blue-700",
                              )}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {st.source === "firestore" ? "어드민 입력" : ".env 폴백"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold">
                              <Circle className="w-3 h-3" /> 미설정
                            </span>
                          )}
                        </div>
                      </div>

                      {st.configured && st.preview && !isEditing && (
                        <p className="text-xs text-gray-400 font-mono mb-1">
                          현재: {visible ? st.preview : "••••••••"}
                          <button
                            onClick={() => setReveal((r) => ({ ...r, [m.key]: !r[m.key] }))}
                            className="ml-2 inline-flex items-center text-gray-500 hover:text-gray-700"
                          >
                            {visible ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </p>
                      )}

                      <div className="flex gap-2">
                        {m.multiline ? (
                          <textarea
                            value={draft ?? ""}
                            onChange={(e) =>
                              setEdits((s) => ({ ...s, [m.key]: e.target.value }))
                            }
                            placeholder={m.placeholder}
                            rows={4}
                            className="flex-1 px-3 py-2 rounded border border-gray-200 text-sm font-mono outline-none focus:border-blue-500"
                          />
                        ) : (
                          <input
                            type={m.secret && !visible ? "password" : "text"}
                            value={draft ?? ""}
                            onChange={(e) =>
                              setEdits((s) => ({ ...s, [m.key]: e.target.value }))
                            }
                            placeholder={m.placeholder}
                            className="flex-1 px-3 py-2 rounded border border-gray-200 text-sm outline-none focus:border-blue-500"
                          />
                        )}
                        {st.source === "firestore" && (
                          <button
                            onClick={() => clearKey(m.key)}
                            title=".env 폴백으로 돌리기"
                            className="px-3 py-2 rounded border border-gray-200 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {m.hint && (
                        <p className="text-xs text-gray-500 mt-1">{m.hint}</p>
                      )}
                      {isEditing && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> 저장되지 않음 — 상단 [저장] 클릭
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
