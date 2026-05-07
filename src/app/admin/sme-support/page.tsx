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
import type { SmeSupportDoc } from "@/types/cms";
import { formatDate } from "@/lib/utils";

const EMPTY: SmeSupportDoc = {
  title: "",
  agency: "",
  deadline: "",
  summary: "",
  bodyHtml: "",
  applyUrl: "",
  status: "draft",
};

export default function AdminSmeSupportPage() {
  const [items, setItems] = useState<SmeSupportDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SmeSupportDoc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCache(COLLECTIONS.SME_SUPPORT);
      const data = await getOrderedCollection<SmeSupportDoc>(
        COLLECTIONS.SME_SUPPORT,
        "deadline",
        "asc",
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
    await removeDoc(COLLECTIONS.SME_SUPPORT, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const save = async (doc: SmeSupportDoc) => {
    if (doc.id) {
      await upsertDoc(COLLECTIONS.SME_SUPPORT, doc.id, doc);
    } else {
      await createDoc(COLLECTIONS.SME_SUPPORT, doc);
    }
    setEditing(null);
    await load();
  };

  return (
    <div>
      <AdminPageHeader
        title="중소기업 지원사업"
        description="진행 중인 지원사업을 등록·관리합니다."
        onRefresh={load}
        onAdd={() => setEditing({ ...EMPTY })}
        addLabel="새 사업"
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
                <th className="px-4 py-3 text-left w-16"></th>
                <th className="px-4 py-3 text-left">제목</th>
                <th className="px-4 py-3 text-left">기관</th>
                <th className="px-4 py-3 text-left">마감</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 w-16">
                    {it.thumbnail && (
                      <img
                        src={it.thumbnail}
                        alt=""
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">{it.title}</td>
                  <td className="px-4 py-3">{it.agency || "—"}</td>
                  <td className="px-4 py-3">
                    {it.deadline ? formatDate(it.deadline) : "—"}
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
        <SmeEditor
          doc={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function SmeEditor({
  doc,
  onClose,
  onSave,
}: {
  doc: SmeSupportDoc;
  onClose: () => void;
  onSave: (d: SmeSupportDoc) => Promise<void>;
}) {
  const [form, setForm] = useState(doc);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {doc.id ? "지원사업 수정" : "새 지원사업"}
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
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="시행 기관">
              <input
                type="text"
                value={form.agency ?? ""}
                onChange={(e) => setForm({ ...form, agency: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200"
              />
            </Field>
            <Field label="마감일">
              <input
                type="date"
                value={form.deadline ?? ""}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200"
              />
            </Field>
          </div>
          <Field label="요약">
            <textarea
              rows={2}
              value={form.summary ?? ""}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </Field>
          <ImageUploader
            label="썸네일·대표 이미지"
            folder="sme-support"
            value={form.thumbnail ?? ""}
            onChange={(url) => setForm({ ...form, thumbnail: url })}
            height={140}
          />
          <Field label="본문">
            <RichEditor
              value={form.bodyHtml}
              onChange={(html) => setForm({ ...form, bodyHtml: html })}
              folder="sme-support"
              minHeight={280}
            />
          </Field>
          <Field label="신청 URL">
            <input
              type="url"
              value={form.applyUrl ?? ""}
              onChange={(e) => setForm({ ...form, applyUrl: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </Field>
          <Field label="상태">
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as SmeSupportDoc["status"] })
              }
              className="px-3 py-2 rounded border border-gray-200"
            >
              <option value="draft">초안</option>
              <option value="published">게시</option>
            </select>
          </Field>
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
