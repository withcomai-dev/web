"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Trash2, X, Check, Send, Sparkles, Loader2 } from "lucide-react";
import {
  COLLECTIONS,
  getOrderedCollection,
  invalidateCache,
  removeDoc,
  updateDocFields,
} from "@/lib/firestore";
import {
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
} from "@/components/admin/AdminTableShell";
import RichEditor from "@/components/admin/RichEditor";
import type { InquiryDoc, InquiryStatus } from "@/types/cms";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "신규",
  in_progress: "처리중",
  answered: "답변완료",
  closed: "종료",
};

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<InquiryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<InquiryDoc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCache(COLLECTIONS.INQUIRIES);
      const data = await getOrderedCollection<InquiryDoc>(
        COLLECTIONS.INQUIRIES,
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

  const updateStatus = async (id: string, status: InquiryStatus) => {
    await updateDocFields(COLLECTIONS.INQUIRIES, id, { status });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const remove = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await removeDoc(COLLECTIONS.INQUIRIES, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div>
      <AdminPageHeader
        title="문의"
        description="사이트에서 접수된 문의 목록입니다. Google Sheets에도 자동 저장됩니다."
        onRefresh={load}
      />

      {loading ? (
        <AdminLoading />
      ) : items.length === 0 ? (
        <AdminEmpty />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">시각</th>
                <th className="px-4 py-3 text-left">유형</th>
                <th className="px-4 py-3 text-left">성함</th>
                <th className="px-4 py-3 text-left">회사</th>
                <th className="px-4 py-3 text-left">연락처</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">시트</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((it) => (
                <tr
                  key={it.id}
                  onClick={() => setSelected(it)}
                  className="hover:bg-blue-50/50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {it.createdAt ? new Date(it.createdAt).toLocaleString("ko-KR") : "—"}
                  </td>
                  <td className="px-4 py-3">{it.type}</td>
                  <td className="px-4 py-3 font-semibold">{it.name}</td>
                  <td className="px-4 py-3 text-gray-600">{it.company || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{it.phone || it.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs",
                        it.status === "new"
                          ? "bg-blue-100 text-blue-700"
                          : it.status === "answered"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600",
                      )}
                    >
                      {STATUS_LABEL[it.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {it.sheetSyncedAt ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <span className="text-xs text-gray-400">미동기</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold">문의 상세</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Detail label="유형" value={selected.type} />
              <Detail label="성함" value={selected.name} />
              <Detail label="회사" value={selected.company || "—"} />
              <Detail label="연락처" value={selected.phone || "—"} />
              <Detail label="이메일" value={selected.email} />
              <Detail label="시각" value={selected.createdAt ?? "—"} />

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">문의 내용</p>
                <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>

              {selected.attachments && selected.attachments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">첨부파일</p>
                  <ul className="space-y-1">
                    {selected.attachments.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded text-sm text-blue-700 hover:bg-blue-100"
                        >
                          📎 {url.split("/").pop()?.split("?")[0] ?? `첨부 ${i + 1}`}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">상태 변경</p>
                <div className="flex gap-2">
                  {(Object.keys(STATUS_LABEL) as InquiryStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id!, s)}
                      className={cn(
                        "px-3 py-1.5 rounded text-xs font-semibold border",
                        selected.status === s
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200",
                      )}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              <ReplyComposer inquiry={selected} onSent={() => updateStatus(selected.id!, "answered")} />

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => remove(selected.id!)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded text-rose-600 hover:bg-rose-50 text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" /> 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReplyComposer({
  inquiry,
  onSent,
}: {
  inquiry: InquiryDoc;
  onSent: () => void;
}) {
  const [reply, setReply] = useState("");
  const [tone, setTone] = useState<"formal" | "friendly" | "apologetic">("formal");
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const draft = async () => {
    setAiLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: inquiry.message,
          context: `유형: ${inquiry.type}, 회사: ${inquiry.company ?? "—"}`,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI 호출 실패");
      // 평문 → 단순 HTML
      const html = `<p>${(data.result as string)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n\n+/g, "</p><p>")
        .replace(/\n/g, "<br>")}</p>`;
      setReply(html);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI 실패");
    } finally {
      setAiLoading(false);
    }
  };

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/mail/inquiry-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: inquiry.email,
          recipientName: inquiry.name,
          inquiryMessage: inquiry.message,
          reply,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "메일 발송 실패");
      setDone(true);
      onSent();
      setTimeout(() => setDone(false), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "발송 실패");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500">답변 작성</p>
        <div className="flex items-center gap-2">
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as typeof tone)}
            className="text-xs px-2 py-1 rounded border border-gray-200"
          >
            <option value="formal">공식</option>
            <option value="friendly">친근</option>
            <option value="apologetic">사과</option>
          </select>
          <button
            onClick={draft}
            disabled={aiLoading}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50"
          >
            {aiLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            AI 초안
          </button>
        </div>
      </div>
      <RichEditor
        value={reply}
        onChange={setReply}
        folder="inquiry-replies"
        minHeight={200}
        placeholder="답변 내용을 입력하거나 [AI 초안]으로 자동 작성"
      />
      {err && <p className="text-sm text-rose-600">{err}</p>}
      <button
        onClick={send}
        disabled={sending || !reply.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold"
      >
        {done ? (
          <>
            <Check className="w-4 h-4" /> 발송 완료
          </>
        ) : sending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Send className="w-4 h-4" /> 답변 메일 발송
          </>
        )}
      </button>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-4 gap-3 text-sm">
      <p className="text-gray-500">{label}</p>
      <p className="col-span-3 text-gray-900">{value}</p>
    </div>
  );
}
