"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Info } from "lucide-react";
import {
  COLLECTIONS,
  getSingletonDoc,
  setSingletonDoc,
} from "@/lib/firestore";
import { MEMBER_GRADES_DOC_ID } from "@/lib/grades";
import { AdminPageHeader } from "@/components/admin/AdminTableShell";
import type { MemberGrade, MemberGradesDoc } from "@/types/cms";
import AccessMatrix from "@/components/admin/AccessMatrix";

function newId(): string {
  return `g_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export default function AdminGradesPage() {
  const [grades, setGrades] = useState<MemberGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    getSingletonDoc<MemberGradesDoc>(COLLECTIONS.SETTINGS, MEMBER_GRADES_DOC_ID)
      .then((d) => setGrades(Array.isArray(d?.grades) ? d!.grades : []))
      .finally(() => setLoading(false));
  }, []);

  // 모든 등급 변경(추가·삭제·순서)은 즉시 저장 (요청 20260701 — 삭제가 저장 안 되던 문제 해결)
  const persist = async (next: MemberGrade[]) => {
    setGrades(next);
    setSaving(true);
    try {
      const clean = next
        .map((g) => ({ id: g.id, label: g.label.trim() }))
        .filter((g) => g.label.length > 0);
      await setSingletonDoc<MemberGradesDoc>(
        COLLECTIONS.SETTINGS,
        MEMBER_GRADES_DOC_ID,
        { grades: clean },
      );
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 1500);
    } finally {
      setSaving(false);
    }
  };

  const add = () => void persist([...grades, { id: newId(), label: "새 등급" }]);
  const updateLabel = (idx: number, label: string) =>
    setGrades((g) => g.map((it, i) => (i === idx ? { ...it, label } : it)));
  const commit = () => void persist(grades); // 라벨 편집 후 포커스 아웃 시 저장
  const remove = (idx: number) => {
    if (
      !confirm(
        "이 등급을 삭제하시겠습니까? 이 등급으로 지정된 회원·콘텐츠·페이지 접근 설정에서는 해당 등급이 사라집니다.",
      )
    )
      return;
    void persist(grades.filter((_, i) => i !== idx));
  };
  const move = (idx: number, dir: -1 | 1) => {
    const t = idx + dir;
    if (t < 0 || t >= grades.length) return;
    const next = [...grades];
    [next[idx], next[t]] = [next[t], next[idx]];
    void persist(next);
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
        title="회원 등급"
        description="회원 등급을 자유롭게 만들고, 등급별로 콘텐츠 열람 범위를 구분합니다. (런모아 등급과 무관한 자체 등급)"
        extra={
          savedAt && (
            <span className="px-3 py-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg">
              저장됨
            </span>
          )
        }
      />

      {/* 설명서 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6 max-w-3xl">
        <h2 className="flex items-center gap-2 font-bold text-blue-900 mb-2">
          <Info className="w-4 h-4" /> 회원 등급 사용법
        </h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-900/80">
          <li>
            <b>여기서 등급을 만듭니다.</b> (예: 일반, 프리미엄, VIP) — 이름은 자유롭게
            지정하세요.
          </li>
          <li>
            <b>[회원]</b> 메뉴에서 각 회원에게 등급을 지정합니다.
          </li>
          <li>
            <b>[업무활용 콘텐츠] / [AI TOOL 소개]</b> 글을 편집할 때 “열람 허용 등급”을
            선택하면, 해당 등급 회원에게만 노출됩니다.
          </li>
          <li>
            열람 허용 등급을 <b>선택하지 않으면 전체 공개</b>입니다. 관리자는 등급과
            무관하게 항상 열람할 수 있습니다.
          </li>
        </ol>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-3xl">
        <div className="space-y-2">
          {grades.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">
              아직 등급이 없습니다. 아래에서 등급을 추가하세요.
            </p>
          )}
          {grades.map((g, idx) => (
            <div
              key={g.id}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"
            >
              <span className="text-xs text-gray-400 w-6 text-center">{idx + 1}</span>
              <input
                type="text"
                value={g.label}
                onChange={(e) => updateLabel(idx, e.target.value)}
                onBlur={commit}
                placeholder="등급 이름"
                className="flex-1 px-3 py-2 rounded border border-gray-200 text-sm bg-white"
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
                disabled={idx === grades.length - 1}
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
            <Plus className="w-4 h-4" /> 등급 추가
          </button>
        </div>

        <div className="flex justify-end items-center pt-4 mt-4 border-t border-gray-100 text-xs text-gray-400">
          {saving ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> 저장 중…
            </span>
          ) : (
            <span>변경하면 자동 저장됩니다</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6 max-w-5xl">
        <h2 className="font-bold text-gray-900 mb-1">
          등급별 접근 설정 (메뉴 · 페이지)
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          어느 등급이 어떤 상단 메뉴·페이지를 볼 수 있는지 한눈에 설정합니다. (개별 글은
          각 글 편집 화면의 “열람 허용 등급”에서)
        </p>
        <AccessMatrix grades={grades} />
      </div>
    </div>
  );
}
