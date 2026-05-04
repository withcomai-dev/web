"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Bug,
  RefreshCw,
  Loader2,
  ExternalLink,
  Trash2,
  Copy,
  X,
  Sparkles,
  Github,
  Mail,
} from "lucide-react";
import {
  COLLECTIONS,
  getOrderedCollection,
  removeDoc,
  updateDocFields,
  invalidateCache,
} from "@/lib/firestore";
import { formatPrompt } from "@/lib/feedback-engine";
import {
  FEEDBACK_STATUS_COLORS,
  FEEDBACK_STATUS_LABELS,
} from "@/lib/constants";
import type { FeedbackReport, FeedbackStatus } from "@/types/cms";
import { cn } from "@/lib/utils";

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "">("");
  const [selected, setSelected] = useState<FeedbackReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCache(COLLECTIONS.FEEDBACK_REPORTS);
      const data = await getOrderedCollection<FeedbackReport>(
        COLLECTIONS.FEEDBACK_REPORTS,
        "createdAt",
        "desc",
      );
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = statusFilter
    ? items.filter((i) => i.status === statusFilter)
    : items;

  // 중복 자동 그룹화: URL + 메시지 첫 단어 기준
  const duplicateMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of items) {
      const key = `${r.context.url}|${r.message.slice(0, 30)}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const dupOf = (r: FeedbackReport): number => {
    const key = `${r.context.url}|${r.message.slice(0, 30)}`;
    return duplicateMap.get(key) ?? 1;
  };

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    await updateDocFields(COLLECTIONS.FEEDBACK_REPORTS, id, { status });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const remove = async (id: string) => {
    if (!confirm("이 신고를 삭제하시겠습니까?")) return;
    await removeDoc(COLLECTIONS.FEEDBACK_REPORTS, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">버그 신고</h1>
          <p className="text-sm text-gray-500 mt-1">사용자가 보낸 신고를 확인합니다.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> 새로고침
        </button>
      </header>

      <div className="mb-4 flex gap-2">
        {(["", "open", "in_progress", "closed"] as const).map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s as FeedbackStatus | "")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-semibold border",
              statusFilter === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200",
            )}
          >
            {s ? FEEDBACK_STATUS_LABELS[s] : "전체"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-20">
          <Bug className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          신고가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="text-left bg-white rounded-xl p-5 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-semibold",
                    FEEDBACK_STATUS_COLORS[r.status],
                  )}
                >
                  {FEEDBACK_STATUS_LABELS[r.status]}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleString("ko-KR")}
                </span>
              </div>
              <p className="font-semibold text-gray-900 line-clamp-2">{r.message}</p>
              <p className="mt-2 text-xs text-gray-500 truncate">
                {r.context.url}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xs text-gray-400">
                  {r.reporterEmail ?? "(비로그인)"}
                </p>
                {dupOf(r) > 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                    유사 {dupOf(r)}건
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <FeedbackDetail
          report={selected}
          onClose={() => setSelected(null)}
          onChangeStatus={updateStatus}
          onDelete={remove}
        />
      )}
    </div>
  );
}

function FeedbackDetail({
  report,
  onClose,
  onChangeStatus,
  onDelete,
}: {
  report: FeedbackReport;
  onClose: () => void;
  onChangeStatus: (id: string, status: FeedbackStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const copyPrompt = () => {
    navigator.clipboard.writeText(formatPrompt(report));
  };

  const aiAnalyze = async () => {
    setAiLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/analyze-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: report.message,
          url: report.context.url,
          routeFile: report.context.routeFile,
          consoleErrors: report.context.consoleErrors,
          networkErrors: report.context.networkErrors,
          screenshotUrl: report.screenshotUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI 호출 실패");
      setAnalysis(data.analysis);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI 실패");
    } finally {
      setAiLoading(false);
    }
  };

  const createIssue = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/github/create-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[버그] ${report.message.slice(0, 80)}`,
          body: formatPrompt(report) + (analysis ? `\n\n---\n## AI 분석\n${analysis}` : ""),
          labels: ["bug", "from-feedback-widget"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "GitHub 실패");
      setIssueUrl(data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "GitHub Issue 생성 실패");
    } finally {
      setBusy(false);
    }
  };

  const notifyReporter = async () => {
    if (!report.reporterEmail) {
      alert("신고자 이메일이 없습니다 (비로그인 신고).");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/mail/feedback-resolved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: report.reporterEmail,
          message: report.message,
          resolution: report.resolution,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "메일 실패");
      alert("신고자에게 처리 결과 메일을 발송했습니다.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "메일 발송 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bug className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold">신고 상세</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <p className="text-xs font-semibold text-gray-500 mb-2">메시지</p>
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm text-gray-900">
              {report.message}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4 text-sm">
            <Field label="상태">
              <div className="flex gap-2">
                {(["open", "in_progress", "closed"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onChangeStatus(report.id!, s)}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-semibold border",
                      report.status === s
                        ? FEEDBACK_STATUS_COLORS[s] + " border-current"
                        : "bg-white text-gray-500 border-gray-200",
                    )}
                  >
                    {FEEDBACK_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="시각">
              <p>{new Date(report.createdAt).toLocaleString("ko-KR")}</p>
            </Field>
            <Field label="신고자">
              <p>{report.reporterEmail ?? "(비로그인)"}</p>
            </Field>
            <Field label="페이지 URL">
              <a
                href={report.context.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate flex items-center gap-1"
              >
                {report.context.pathname}
                <ExternalLink className="w-3 h-3" />
              </a>
            </Field>
            <Field label="라우트 파일">
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {report.context.routeFile}
              </code>
            </Field>
            <Field label="뷰포트 / 언어">
              <p>
                {report.context.viewport.w}×{report.context.viewport.h} ·{" "}
                {report.context.language}
              </p>
            </Field>
          </section>

          <Field label="브라우저">
            <p className="text-xs text-gray-600 break-all">
              {report.context.userAgent}
            </p>
          </Field>

          {report.screenshotUrl && (
            <section>
              <p className="text-xs font-semibold text-gray-500 mb-2">화면 캡처</p>
              <a
                href={report.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={report.screenshotUrl}
                  alt="화면 캡처"
                  className="w-full rounded-lg border border-gray-200"
                />
              </a>
            </section>
          )}

          {report.context.consoleErrors.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-500 mb-2">최근 콘솔 에러</p>
              <ul className="space-y-1 text-xs font-mono bg-rose-50 text-rose-900 p-3 rounded-lg">
                {report.context.consoleErrors.map((e, i) => (
                  <li key={i}>
                    [{new Date(e.at).toLocaleTimeString()}] {e.message}
                    {e.source && (
                      <span className="text-rose-500"> ({e.source}:{e.line})</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.context.networkErrors.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-500 mb-2">네트워크 실패</p>
              <ul className="space-y-1 text-xs font-mono bg-amber-50 text-amber-900 p-3 rounded-lg">
                {report.context.networkErrors.map((n, i) => (
                  <li key={i}>
                    {n.method} {n.url} → {n.status ?? "FAIL"} {n.statusText}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.domSnapshot && (
            <details>
              <summary className="cursor-pointer text-xs font-semibold text-gray-500 mb-2">
                DOM 스냅샷 ({(report.domSnapshot.length / 1024).toFixed(1)}KB)
              </summary>
              <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-auto max-h-64">
                {report.domSnapshot}
              </pre>
            </details>
          )}

          {analysis && (
            <section className="mt-2">
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" /> AI 분석
              </p>
              <div className="p-4 bg-violet-50 rounded-lg whitespace-pre-wrap text-sm leading-relaxed">
                {analysis}
              </div>
            </section>
          )}

          {issueUrl && (
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100"
            >
              ✓ GitHub Issue 생성됨 → {issueUrl}
            </a>
          )}

          {err && <p className="text-sm text-rose-600">{err}</p>}

          <div className="flex flex-wrap justify-between gap-2 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={aiAnalyze}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 text-sm font-semibold disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                AI 분석
              </button>
              <button
                onClick={createIssue}
                disabled={busy}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                <Github className="w-4 h-4" /> GitHub Issue
              </button>
              {report.reporterEmail && (
                <button
                  onClick={notifyReporter}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" /> 신고자 알림 메일
                </button>
              )}
              <button
                onClick={copyPrompt}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold"
              >
                <Copy className="w-4 h-4" /> 프롬프트 복사
              </button>
            </div>
            <button
              onClick={() => onDelete(report.id!)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-sm font-semibold"
            >
              <Trash2 className="w-4 h-4" /> 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  );
}
