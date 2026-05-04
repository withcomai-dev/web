"use client";

import { useEffect, useState, useCallback } from "react";
import { Edit2, Trash2, X, Save, Eye, EyeOff } from "lucide-react";
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
import ImageUploader from "@/components/admin/ImageUploader";
import type { BannerDoc } from "@/types/cms";

const EMPTY: BannerDoc = {
  title: "",
  imageUrl: "",
  link: "",
  order: 0,
  visible: true,
};

export default function AdminBannersPage() {
  const [items, setItems] = useState<BannerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BannerDoc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCache(COLLECTIONS.BANNERS);
      const data = await getOrderedCollection<BannerDoc>(
        COLLECTIONS.BANNERS,
        "order",
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
    await removeDoc(COLLECTIONS.BANNERS, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const save = async (b: BannerDoc) => {
    if (b.id) {
      await upsertDoc(COLLECTIONS.BANNERS, b.id, b);
    } else {
      await createDoc(COLLECTIONS.BANNERS, b);
    }
    setEditing(null);
    await load();
  };

  return (
    <div>
      <AdminPageHeader
        title="배너"
        description="메인 배너·CTA를 관리합니다."
        onRefresh={load}
        onAdd={() => setEditing({ ...EMPTY })}
        addLabel="새 배너"
      />

      {loading ? (
        <AdminLoading />
      ) : items.length === 0 ? (
        <AdminEmpty />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              {b.imageUrl && (
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{b.title}</p>
                  {b.visible ? (
                    <Eye className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-300" />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{b.link}</p>
                <div className="mt-3 flex justify-end gap-1">
                  <button
                    onClick={() => setEditing(b)}
                    className="p-1.5 text-gray-500 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(b.id!)}
                    className="p-1.5 text-gray-500 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <BannerEditor
          doc={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function BannerEditor({
  doc,
  onClose,
  onSave,
}: {
  doc: BannerDoc;
  onClose: () => void;
  onSave: (b: BannerDoc) => Promise<void>;
}) {
  const [form, setForm] = useState(doc);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">{doc.id ? "배너 수정" : "새 배너"}</h2>
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
          <ImageUploader
            label="이미지"
            folder="banners"
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            height={160}
          />
          <Field label="링크">
            <input
              type="url"
              value={form.link ?? ""}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="순서">
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded border border-gray-200"
              />
            </Field>
            <Field label="노출">
              <select
                value={form.visible ? "1" : "0"}
                onChange={(e) =>
                  setForm({ ...form, visible: e.target.value === "1" })
                }
                className="w-full px-3 py-2 rounded border border-gray-200"
              >
                <option value="1">보임</option>
                <option value="0">숨김</option>
              </select>
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
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave(form);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !form.title || !form.imageUrl}
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
