"use client";

import { useEffect, useState, useCallback } from "react";
import { Edit2, Trash2, X, Save, Send, MessageSquare, Sparkles, Loader2, Mail } from "lucide-react";
import {
  COLLECTIONS,
  createDoc,
  getOrderedCollection,
  invalidateCache,
  removeDoc,
  updateDocFields,
  upsertDoc,
} from "@/lib/firestore";
import {
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
} from "@/components/admin/AdminTableShell";
import RichEditor from "@/components/admin/RichEditor";
import { HELP_CATEGORIES } from "@/lib/constants";
import { slugify, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { HelpDoc, HelpQuestion } from "@/types/cms";
import { cn } from "@/lib/utils";

const EMPTY: HelpDoc = {
  category: HELP_CATEGORIES[0],
  title: "",
  slug: "",
  bodyHtml: "",
  audience: "public",
  order: 0,
  status: "draft",
};

export default function AdminHelpPage() {
  const [tab, setTab] = useState<"docs" | "questions">("docs");
  const [docs, setDocs] = useState<HelpDoc[]>([]);
  const [questions, setQuestions] = useState<HelpQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HelpDoc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCache(COLLECTIONS.HELP_DOCS);
      invalidateCache(COLLECTIONS.HELP_QUESTIONS);
      const [d, q] = await Promise.all([
        getOrderedCollection<HelpDoc>(COLLECTIONS.HELP_DOCS, "order", "asc"),
        getOrderedCollection<HelpQuestion>(
          COLLECTIONS.HELP_QUESTIONS,
          "createdAt",
          "desc",
        ),
      ]);
      setDocs(d);
      setQuestions(q);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (doc: HelpDoc) => {
    const slug = doc.slug || slugify(doc.title);
    const payload = { ...doc, slug };
    if (doc.id) {
      await upsertDoc(COLLECTIONS.HELP_DOCS, doc.id, payload);
    } else {
      await createDoc(COLLECTIONS.HELP_DOCS, payload);
    }
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await removeDoc(COLLECTIONS.HELP_DOCS, id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div>
      <AdminPageHeader
        title="도움말"
        description="도움말 글과 사용자 질문을 관리합니다."
        onRefresh={load}
        onAdd={tab === "docs" ? () => setEditing({ ...EMPTY }) : undefined}
        addLabel="새 도움말"
      />

      <div className="flex border-b border-gray-200 mb-6">
        <TabBtn active={tab === "docs"} onClick={() => setTab("docs")}>
          도움말 글 ({docs.length})
        </TabBtn>
        <TabBtn active={tab === "questions"} onClick={() => setTab("questions")}>
          받은 질문 (
          {questions.filter((q) => q.status === "open").length}/{questions.length})
        </TabBtn>
      </div>

      {loading ? (
        <AdminLoading />
      ) : tab === "docs" ? (
        docs.length === 0 ? (
          <AdminEmpty />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">제목</th>
                  <th className="px-4 py-3 text-left">카테고리</th>
                  <th className="px-4 py-3 text-left">대상</th>
                  <th className="px-4 py-3 text-left">상태</th>
                  <th className="px-4 py-3 text-left">최종 수정</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docs.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{d.title}</td>
                    <td className="px-4 py-3">{d.category}</td>
                    <td className="px-4 py-3 text-xs">{d.audience}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          d.status === "published"
                            ? "px-2 py-0.5 rounded text-xs bg-green-100 text-green-700"
                            : "px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                        }
                      >
                        {d.status === "published" ? "게시" : "초안"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {d.updatedAt ? formatDate(d.updatedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(d)}
                        className="p-1.5 text-gray-500 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => remove(d.id!)}
                        className="p-1.5 text-gray-500 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : questions.length === 0 ? (
        <AdminEmpty message="받은 질문이 없습니다." />
      ) : (
        <QuestionList items={questions} onUpdate={load} />
      )}

      {editing && (
        <HelpDocEditor
          doc={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
        active ? "text-blue-600 border-blue-600" : "text-gray-500 border-transparent",
      )}
    >
      {children}
    </button>
  );
}

function HelpDocEditor({
  doc,
  onClose,
  onSave,
}: {
  doc: HelpDoc;
  onClose: () => void;
  onSave: (d: HelpDoc) => Promise<void>;
}) {
  const [form, setForm] = useState<HelpDoc>(doc);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{doc.id ? "도움말 수정" : "새 도움말"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Row label="제목">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </Row>
          <div className="grid grid-cols-3 gap-3">
            <Row label="카테고리">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200"
              >
                {HELP_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Row>
            <Row label="대상">
              <select
                value={form.audience}
                onChange={(e) =>
                  setForm({ ...form, audience: e.target.value as HelpDoc["audience"] })
                }
                className="w-full px-3 py-2 rounded border border-gray-200"
              >
                <option value="public">공개(사용자)</option>
                <option value="admin">관리자</option>
                <option value="both">모두</option>
              </select>
            </Row>
            <Row label="순서">
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded border border-gray-200"
              />
            </Row>
          </div>
          <Row label="슬러그">
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="자동 생성됨"
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </Row>
          <Row label="본문">
            <RichEditor
              value={form.bodyHtml}
              onChange={(html) => setForm({ ...form, bodyHtml: html })}
              folder="help"
              minHeight={320}
            />
          </Row>
          <Row label="상태">
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as HelpDoc["status"] })
              }
              className="px-3 py-2 rounded border border-gray-200"
            >
              <option value="draft">초안</option>
              <option value="published">게시</option>
            </select>
          </Row>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
              취소
            </button>
            <button
              onClick={submit}
              disabled={saving || !form.title}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold"
            >
              <Save className="w-4 h-4" /> 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionList({
  items,
  onUpdate,
}: {
  items: HelpQuestion[];
  onUpdate: () => void;
}) {
  const { profile } = useAuth();
  const [answering, setAnswering] = useState<HelpQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendMail, setSendMail] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const aiDraft = async () => {
    if (!answering) return;
    setAiLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: answering.question,
          tone: "friendly",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI 호출 실패");
      setAnswer(data.result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI 실패");
    } finally {
      setAiLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answering || !answer.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await updateDocFields(COLLECTIONS.HELP_QUESTIONS, answering.id!, {
        answer: answer.trim(),
        answeredAt: new Date().toISOString(),
        answererEmail: profile?.email,
        status: "answered",
      });
      if (sendMail && answering.askerEmail) {
        try {
          await fetch("/api/mail/help-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: answering.askerEmail,
              question: answering.question,
              answer: answer.trim(),
            }),
          });
        } catch {
          // mail failure is non-blocking
        }
      }
      setAnswering(null);
      setAnswer("");
      await onUpdate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {items.map((q) => (
          <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-semibold",
                  q.status === "open"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                {q.status === "open" ? "신규" : "답변 완료"}
              </span>
              <span className="text-xs text-gray-400">{q.askerEmail ?? "(비로그인)"}</span>
            </div>
            <p className="font-semibold text-gray-900 mb-2">{q.question}</p>
            {q.pageUrl && (
              <p className="text-xs text-gray-500 mb-3 truncate">{q.pageUrl}</p>
            )}
            {q.answer && (
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs font-semibold text-emerald-700 mb-1">답변</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.answer}</p>
              </div>
            )}
            {q.status === "open" && (
              <button
                onClick={() => {
                  setAnswering(q);
                  setAnswer("");
                }}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <MessageSquare className="w-4 h-4" /> 답변하기
              </button>
            )}
          </div>
        ))}
      </div>

      {answering && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold">답변 작성</h3>
              <button
                onClick={() => setAnswering(null)}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="p-3 bg-gray-50 rounded text-sm">{answering.question}</div>
              <div className="flex justify-end">
                <button
                  onClick={aiDraft}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI 초안
                </button>
              </div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                placeholder="답변을 입력하세요."
                className="w-full px-3 py-2 rounded border border-gray-200"
              />
              {answering.askerEmail && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sendMail}
                    onChange={(e) => setSendMail(e.target.checked)}
                  />
                  <Mail className="w-4 h-4 text-gray-500" />
                  답변을 <strong>{answering.askerEmail}</strong>로 메일 발송
                </label>
              )}
              {err && <p className="text-sm text-rose-600">{err}</p>}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setAnswering(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  취소
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={saving || !answer.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  답변 저장 + 메일
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
