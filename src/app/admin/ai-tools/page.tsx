"use client";

import { useEffect, useState, useCallback } from "react";
import { Edit2, Trash2, X, Save } from "lucide-react";
import {
  COLLECTIONS,
  createDoc,
  getOrderedCollection,
  invalidateCache,
  removeDoc,
  upsertDoc,
} from "@/lib/firestore";
import {
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
} from "@/components/admin/AdminTableShell";
import RichEditor from "@/components/admin/RichEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import { useAuth } from "@/contexts/AuthContext";
import { AI_TOOL_CATEGORIES, AI_TOOL_CATEGORY_LABELS } from "@/lib/constants";
import type { AiToolDoc } from "@/types/cms";
import { formatDate, slugify } from "@/lib/utils";

const EMPTY: AiToolDoc = {
  category: AI_TOOL_CATEGORIES[0].slug,
  title: "",
  slug: "",
  thumbnail: "",
  bodyHtml: "",
  summary: "",
  status: "draft",
};

export default function AdminAiToolsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<AiToolDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AiToolDoc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCache(COLLECTIONS.AI_TOOLS);
      const data = await getOrderedCollection<AiToolDoc>(
        COLLECTIONS.AI_TOOLS,
        "publishedAt",
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

  const remove = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await removeDoc(COLLECTIONS.AI_TOOLS, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const save = async (doc: AiToolDoc) => {
    const slug = doc.slug || slugify(doc.title);
    const payload: Partial<AiToolDoc> = {
      ...doc,
      slug,
      authorEmail: profile?.email,
      publishedAt:
        doc.status === "published"
          ? doc.publishedAt ?? new Date().toISOString()
          : doc.publishedAt,
    };
    if (doc.id) {
      await upsertDoc(COLLECTIONS.AI_TOOLS, doc.id, payload);
    } else {
      const newId = await createDoc(COLLECTIONS.AI_TOOLS, payload);
      payload.id = newId;
    }
    setEditing(null);
    await load();
  };

  return (
    <div>
      <AdminPageHeader
        title="AI TOOL 소개"
        description="스마트워크&AI 페이지의 6개 카드와 연결되는 게시판 글을 관리합니다."
        onRefresh={load}
        onAdd={() => setEditing({ ...EMPTY })}
        addLabel="새 글"
      />

      {loading ? (
        <AdminLoading />
      ) : items.length === 0 ? (
        <AdminEmpty />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">제목</th>
                <th className="px-4 py-3 text-left">카테고리</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">발행일</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{it.title}</p>
                    <p className="text-xs text-gray-500">/{it.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {AI_TOOL_CATEGORY_LABELS[it.category] ?? it.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        it.status === "published"
                          ? "px-2 py-0.5 rounded text-xs bg-green-100 text-green-700"
                          : "px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                      }
                    >
                      {it.status === "published" ? "게시" : "초안"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {it.publishedAt ? formatDate(it.publishedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(it)}
                      className="p-1.5 text-gray-500 hover:text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(it.id!)}
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
      )}

      {editing && (
        <AiToolEditor
          doc={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function AiToolEditor({
  doc,
  onClose,
  onSave,
}: {
  doc: AiToolDoc;
  onClose: () => void;
  onSave: (d: AiToolDoc) => Promise<void>;
}) {
  const [form, setForm] = useState<AiToolDoc>(doc);
  const [saving, setSaving] = useState(false);

  const update = (k: keyof AiToolDoc, v: unknown) =>
    setForm((s) => ({ ...s, [k]: v }));

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
          <h2 className="text-lg font-bold">
            {doc.id ? "소개 글 수정" : "새 소개 글"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="제목">
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="슬러그 (URL)">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="자동 생성됨"
                className="w-full px-3 py-2 rounded border border-gray-200"
              />
            </Field>
            <Field label="카테고리 (연결될 카드)">
              <select
                value={form.category}
                onChange={(e) =>
                  update("category", e.target.value as AiToolDoc["category"])
                }
                className="w-full px-3 py-2 rounded border border-gray-200"
              >
                {AI_TOOL_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <ImageUploader
            label="썸네일"
            folder="ai-tools"
            value={form.thumbnail ?? ""}
            onChange={(url) => update("thumbnail", url)}
            height={140}
          />
          <Field label="요약">
            <textarea
              value={form.summary ?? ""}
              onChange={(e) => update("summary", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </Field>
          <Field label="본문">
            <RichEditor
              value={form.bodyHtml}
              onChange={(html) => update("bodyHtml", html)}
              folder="ai-tools"
              minHeight={320}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="상태">
              <select
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value as AiToolDoc["status"])
                }
                className="w-full px-3 py-2 rounded border border-gray-200"
              >
                <option value="draft">초안</option>
                <option value="published">게시</option>
              </select>
            </Field>
            <Field label="발행 일시">
              <input
                type="datetime-local"
                value={
                  form.publishedAt
                    ? new Date(form.publishedAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  update(
                    "publishedAt",
                    e.target.value ? new Date(e.target.value).toISOString() : "",
                  )
                }
                className="w-full px-3 py-2 rounded border border-gray-200"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
