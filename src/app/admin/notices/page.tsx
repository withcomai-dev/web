"use client";

import { useEffect, useState, useCallback } from "react";
import { Edit2, Trash2, X, Save, Pin } from "lucide-react";
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
import GradeAccessSelect from "@/components/admin/GradeAccessSelect";
import type { NoticeDoc } from "@/types/cms";
import { formatDate } from "@/lib/utils";

const EMPTY: NoticeDoc = {
  title: "",
  bodyHtml: "",
  pinned: false,
  publishedAt: "",
  status: "draft",
};

/** 고정 공지 먼저, 그다음 게시일 내림차순 */
function sortNotices(list: NoticeDoc[]): NoticeDoc[] {
  return [...list].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
  });
}

export default function AdminNoticesPage() {
  const [items, setItems] = useState<NoticeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NoticeDoc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCache(COLLECTIONS.NOTICES);
      const data = await getCollection<NoticeDoc>(COLLECTIONS.NOTICES);
      setItems(sortNotices(data));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await removeDoc(COLLECTIONS.NOTICES, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const save = async (doc: NoticeDoc) => {
    const payload = {
      ...doc,
      publishedAt: doc.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (doc.id) {
      await upsertDoc(COLLECTIONS.NOTICES, doc.id, payload);
    } else {
      await createDoc(COLLECTIONS.NOTICES, {
        ...payload,
        createdAt: new Date().toISOString(),
      });
    }
    setEditing(null);
    await load();
  };

  return (
    <div>
      <AdminPageHeader
        title="공지사항"
        description="사이트 공지를 등록·관리합니다. 공지 작성은 여기(관리자)에서만 가능합니다."
        onRefresh={load}
        onAdd={() => setEditing({ ...EMPTY })}
        addLabel="새 공지"
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
                <th className="px-4 py-3 text-left w-16">고정</th>
                <th className="px-4 py-3 text-left">제목</th>
                <th className="px-4 py-3 text-left">게시일</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {it.pinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
                        <Pin className="w-3 h-3" /> 고정
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">{it.title}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {it.publishedAt ? formatDate(it.publishedAt) : "—"}
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
        <NoticeEditor doc={editing} onClose={() => setEditing(null)} onSave={save} />
      )}
    </div>
  );
}

function NoticeEditor({
  doc,
  onClose,
  onSave,
}: {
  doc: NoticeDoc;
  onClose: () => void;
  onSave: (d: NoticeDoc) => Promise<void>;
}) {
  const [form, setForm] = useState(doc);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {doc.id ? "공지 수정" : "새 공지"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              제목
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              본문
            </label>
            <RichEditor
              value={form.bodyHtml}
              onChange={(html) => setForm({ ...form, bodyHtml: html })}
              folder="notices"
              minHeight={280}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                게시일 (비우면 저장 시각)
              </label>
              <input
                type="datetime-local"
                value={
                  form.publishedAt
                    ? new Date(form.publishedAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    publishedAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
                className="w-full px-3 py-2 rounded border border-gray-200"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!!form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                />
                중요 공지 (상단 고정)
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as NoticeDoc["status"] })
                }
                className="px-3 py-2 rounded border border-gray-200"
              >
                <option value="draft">초안</option>
                <option value="published">게시</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              열람 허용 등급 (회원 등급별 노출)
            </label>
            <GradeAccessSelect
              value={form.allowedGrades}
              onChange={(v) => setForm({ ...form, allowedGrades: v })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              취소
            </button>
            <button
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave(form);
                } finally {
                  setSaving(false);
                }
              }}
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
