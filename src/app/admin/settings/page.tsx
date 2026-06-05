"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  COLLECTIONS,
  GLOBAL_SETTINGS_DOC_ID,
  getSingletonDoc,
  setSingletonDoc,
} from "@/lib/firestore";
import { AdminPageHeader } from "@/components/admin/AdminTableShell";
import { COMPANY, NAV_ITEMS } from "@/lib/constants";
import ImageUploader from "@/components/admin/ImageUploader";
import type { GlobalSettings } from "@/types/cms";
import { featureDisabled } from "@/lib/static-mode";

const DEFAULT: GlobalSettings = {
  logoUrl: "",
  navItems: NAV_ITEMS,
  footerText: "",
  contactPhone: COMPANY.phone,
  contactEmail: COMPANY.email,
  contactAddress: COMPANY.address,
  defaultSeoTitle: "",
  defaultSeoDescription: "",
  sideTalkScriptId: "",
  sideTalkExpiresAt: "",
  designTokens: {
    primaryColor: "#2563eb",
    primaryDarkColor: "#1d4ed8",
    fontFamily: "Inter, sans-serif",
  },
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<GlobalSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    getSingletonDoc<GlobalSettings>(COLLECTIONS.SETTINGS, GLOBAL_SETTINGS_DOC_ID)
      .then((d) => setForm(d ?? DEFAULT))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await setSingletonDoc(COLLECTIONS.SETTINGS, GLOBAL_SETTINGS_DOC_ID, form);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );

  return (
    <div>
      <AdminPageHeader
        title="사이트 설정"
        description="회사정보·SEO·외부 위젯 설정을 관리합니다."
        extra={
          savedAt && (
            <span className="px-3 py-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg">
              저장됨
            </span>
          )
        }
      />

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6 max-w-3xl">
        <Section title="연락처">
          <Row label="전화">
            <Input
              value={form.contactPhone ?? ""}
              onChange={(v) => setForm({ ...form, contactPhone: v })}
            />
          </Row>
          <Row label="이메일">
            <Input
              value={form.contactEmail ?? ""}
              onChange={(v) => setForm({ ...form, contactEmail: v })}
            />
          </Row>
          <Row label="주소">
            <Input
              value={form.contactAddress ?? ""}
              onChange={(v) => setForm({ ...form, contactAddress: v })}
            />
          </Row>
        </Section>

        <Section title="브랜드">
          <ImageUploader
            label="로고"
            folder="brand"
            value={form.logoUrl ?? ""}
            onChange={(url) => setForm({ ...form, logoUrl: url })}
            height={100}
          />
          <Row label="푸터 텍스트">
            <Input
              value={form.footerText ?? ""}
              onChange={(v) => setForm({ ...form, footerText: v })}
            />
          </Row>
        </Section>

        <Section title="네비게이션 메뉴 (드래그 없이 화살표로 순서 변경)">
          <NavEditor
            items={form.navItems ?? []}
            onChange={(items) => setForm({ ...form, navItems: items })}
          />
        </Section>

        <Section title="디자인 토큰">
          <div className="grid grid-cols-3 gap-3">
            <Row label="Primary 컬러">
              <input
                type="color"
                value={form.designTokens?.primaryColor ?? "#2563eb"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    designTokens: { ...form.designTokens, primaryColor: e.target.value },
                  })
                }
                className="w-full h-10 rounded border border-gray-200"
              />
            </Row>
            <Row label="Primary Dark">
              <input
                type="color"
                value={form.designTokens?.primaryDarkColor ?? "#1d4ed8"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    designTokens: {
                      ...form.designTokens,
                      primaryDarkColor: e.target.value,
                    },
                  })
                }
                className="w-full h-10 rounded border border-gray-200"
              />
            </Row>
            <Row label="폰트">
              <input
                type="text"
                value={form.designTokens?.fontFamily ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    designTokens: { ...form.designTokens, fontFamily: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded border border-gray-200"
              />
            </Row>
          </div>
        </Section>

        <Section title="SEO 기본값">
          <Row label="기본 SEO 제목">
            <Input
              value={form.defaultSeoTitle ?? ""}
              onChange={(v) => setForm({ ...form, defaultSeoTitle: v })}
            />
          </Row>
          <Row label="기본 SEO 설명">
            <textarea
              value={form.defaultSeoDescription ?? ""}
              onChange={(e) =>
                setForm({ ...form, defaultSeoDescription: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </Row>
        </Section>

        <Section title="사이드톡(SideTalk)">
          <Row label="스크립트 ID">
            <Input
              value={form.sideTalkScriptId ?? ""}
              onChange={(v) => setForm({ ...form, sideTalkScriptId: v })}
            />
          </Row>
          <Row label="무상 지원 만료일">
            <Input
              value={form.sideTalkExpiresAt ?? ""}
              onChange={(v) => setForm({ ...form, sideTalkExpiresAt: v })}
              placeholder="YYYY-MM-DD"
            />
          </Row>
        </Section>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            전체 저장
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6 max-w-3xl">
        <h2 className="font-bold text-gray-900 mb-3">백업 / 복원</h2>
        <p className="text-sm text-gray-500 mb-4">
          모든 컬렉션을 JSON으로 내보내거나, 이전 백업을 업로드해 복원합니다. 복원은
          <strong> merge 모드</strong>로 진행됩니다 (덮어쓰기 + 추가).
        </p>
        <BackupRestore />
      </div>
    </div>
  );
}

function BackupRestore() {
  const [restoring, setRestoring] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const onRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm("정말 복원하시겠습니까? 기존 데이터에 덮어쓰여집니다.")) return;
    setRestoring(true);
    setResult(null);
    try {
      featureDisabled();
    } catch (err) {
      setResult(`오류: ${err instanceof Error ? err.message : "fail"}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <a
        href="/api/backup/export"
        download
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
      >
        📥 전체 백업 다운로드 (JSON)
      </a>
      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold cursor-pointer">
        {restoring ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <span>📤 백업 파일 업로드</span>
        )}
        <input
          type="file"
          accept="application/json"
          onChange={onRestore}
          disabled={restoring}
          className="hidden"
        />
      </label>
      {result && <p className="text-xs text-gray-600 w-full mt-2">{result}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3 pl-1">{children}</div>
    </div>
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

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded border border-gray-200"
    />
  );
}

function NavEditor({
  items,
  onChange,
}: {
  items: { label: string; href: string }[];
  onChange: (next: { label: string; href: string }[]) => void;
}) {
  const update = (idx: number, patch: Partial<(typeof items)[0]>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const remove = (idx: number) => {
    if (!confirm("이 메뉴를 삭제하시겠습니까?")) return;
    onChange(items.filter((_, i) => i !== idx));
  };
  const add = () =>
    onChange([...items, { label: "새 메뉴", href: "/" }]);

  return (
    <div className="space-y-2">
      {items.map((it, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"
        >
          <span className="text-xs text-gray-400 w-6 text-center">{idx + 1}</span>
          <input
            type="text"
            value={it.label}
            onChange={(e) => update(idx, { label: e.target.value })}
            placeholder="라벨"
            className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm bg-white"
          />
          <input
            type="text"
            value={it.href}
            onChange={(e) => update(idx, { href: e.target.value })}
            placeholder="/about"
            className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm bg-white font-mono"
          />
          <button
            type="button"
            onClick={() => move(idx, -1)}
            disabled={idx === 0}
            className="p-1 hover:bg-white rounded disabled:opacity-30"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => move(idx, 1)}
            disabled={idx === items.length - 1}
            className="p-1 hover:bg-white rounded disabled:opacity-30"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => remove(idx)}
            className="p-1 hover:bg-rose-50 hover:text-rose-600 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 text-sm text-gray-600 inline-flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> 메뉴 추가
      </button>
    </div>
  );
}
