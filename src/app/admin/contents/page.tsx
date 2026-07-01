"use client";

import { useEffect, useState, useCallback } from "react";
import { Edit2, Trash2, X, Save } from "lucide-react";
import {
  COLLECTIONS,
  createDoc,
  getCollection,
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
import GradeAccessSelect from "@/components/admin/GradeAccessSelect";
import { useAuth } from "@/contexts/AuthContext";
import type { ContentDoc } from "@/types/cms";
import { formatDate, slugify } from "@/lib/utils";

const EMPTY: ContentDoc = {
  title: "",
  slug: "",
  category: "AI 활용 팁",
  thumbnail: "",
  bodyHtml: "",
  summary: "",
  status: "draft",
};

export default function AdminContentsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<ContentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ContentDoc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCache(COLLECTIONS.CONTENTS);
      // ⚠️ Firestore orderBy는 정렬 필드가 없는 문서를 제외하므로(초안이 목록에서 증발)
      // 전체를 받아 클라이언트에서 정렬한다 — 발행일 없는 초안이 맨 위.
      const data = await getCollection<ContentDoc>(COLLECTIONS.CONTENTS);
      data.sort((a, b) =>
        (b.publishedAt ?? "9999").localeCompare(a.publishedAt ?? "9999"),
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
    await removeDoc(COLLECTIONS.CONTENTS, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const save = async (doc: ContentDoc) => {
    const slug = doc.slug || slugify(doc.title);
    const payload: Partial<ContentDoc> = {
      ...doc,
      slug,
      authorEmail: profile?.email,
      publishedAt:
        doc.status === "published"
          ? doc.publishedAt ?? new Date().toISOString()
          : doc.publishedAt,
    };
    // ⚠️ 클라이언트 SDK는 undefined 값을 거부(addDoc throw — 초안 저장 실패 원인) → 키 제거
    (Object.keys(payload) as (keyof ContentDoc)[]).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });
    if (doc.id) {
      await upsertDoc(COLLECTIONS.CONTENTS, doc.id, payload);
    } else {
      const newId = await createDoc(COLLECTIONS.CONTENTS, payload);
      payload.id = newId;
    }
    setEditing(null);
    await load();
  };

  return (
    <div>
      <AdminPageHeader
        title="업무활용 콘텐츠"
        description="홈·업무활용 콘텐츠에 노출되는 게시글을 관리합니다."
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
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                      {it.pinned && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold shrink-0">
                          고정
                        </span>
                      )}
                      {it.title}
                    </p>
                    <p className="text-xs text-gray-500">/{it.slug}</p>
                  </td>
                  <td className="px-4 py-3">{it.category}</td>
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
        <ContentEditor
          doc={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function ContentEditor({
  doc,
  onClose,
  onSave,
}: {
  doc: ContentDoc;
  onClose: () => void;
  onSave: (d: ContentDoc) => Promise<void>;
}) {
  const [form, setForm] = useState<ContentDoc>(doc);
  const [saving, setSaving] = useState(false);

  const update = (k: keyof ContentDoc, v: unknown) =>
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
            {doc.id ? "콘텐츠 수정" : "새 콘텐츠"}
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
            <Field label="카테고리">
              <input
                type="text"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-200"
              />
            </Field>
          </div>
          <ImageUploader
            label="썸네일"
            folder="contents"
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
              folder="contents"
              minHeight={320}
            />
          </Field>
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.pinned ?? false}
              onChange={(e) => update("pinned", e.target.checked)}
            />
            <span>
              <b>항상 노출 (고정)</b> — 홈·목록에서 최신글보다 먼저 표시됩니다
            </span>
          </label>
          <Field label="열람 허용 등급 (회원 등급별 노출)">
            <GradeAccessSelect
              value={form.allowedGrades}
              onChange={(v) => update("allowedGrades", v)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="상태">
              <select
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value as ContentDoc["status"])
                }
                className="w-full px-3 py-2 rounded border border-gray-200"
              >
                <option value="draft">초안</option>
                <option value="published">게시</option>
              </select>
            </Field>
            <Field label="발행 일시 (예약 가능 — 미래 시각 시 cron이 자동 게시)">
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
