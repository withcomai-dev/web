"use client";

import { useEffect, useState, Fragment } from "react";
import { Loader2, Save, Check } from "lucide-react";
import {
  COLLECTIONS,
  GLOBAL_SETTINGS_DOC_ID,
  PAGE_DOC_ID,
  getSingletonDoc,
  setSingletonDoc,
  updateDocFields,
} from "@/lib/firestore";
import { gradesWithGuest, isGradeChecked, toggleGrade } from "@/lib/grades";
import { loadRegistry } from "@/lib/page-registry";
import { ALL_PAGE_SEEDS } from "@/lib/seed-data";
import type { MemberGrade, GlobalSettings, PageDoc } from "@/types/cms";
import { cn } from "@/lib/utils";

type NavItems = NonNullable<GlobalSettings["navItems"]>;

/**
 * 등급별 접근 매트릭스 (요청 20260701):
 * 행=상단 메뉴(+서브메뉴)·페이지 / 열=비회원(기본)+회원 등급.
 * 기본 전체공개는 '전부 체크'로 표시하고, 체크를 해제하면 그 등급만 노출을 막는다.
 * 등급 목록은 부모(회원 등급 페이지)에서 prop 으로 받아 추가·삭제가 즉시 반영된다.
 */
export default function AccessMatrix({ grades }: { grades: MemberGrade[] }) {
  const [nav, setNav] = useState<NavItems>([]);
  const [pages, setPages] = useState<
    { key: string; title: string; allowed: string[] }[]
  >([]);
  const [dirtyPages, setDirtyPages] = useState<Set<string>>(new Set());
  const [navDirty, setNavDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const [settings, reg] = await Promise.all([
        getSingletonDoc<GlobalSettings>(
          COLLECTIONS.SETTINGS,
          GLOBAL_SETTINGS_DOC_ID,
        ),
        loadRegistry(),
      ]);
      setNav(settings?.navItems ?? []);
      const pageDocs = await Promise.all(
        reg.map(async (r) => {
          const p = await getSingletonDoc<PageDoc>(
            COLLECTIONS.SETTINGS,
            PAGE_DOC_ID(r.key),
          );
          return { key: r.key, title: r.title, allowed: p?.allowedGrades ?? [] };
        }),
      );
      setPages(pageDocs);
      setLoading(false);
    })();
  }, []);

  // 컬럼 = 비회원(기본) + 정의된 회원 등급 (prop 이라 추가·삭제 즉시 반영)
  const cols = gradesWithGuest(grades);
  const allIds = cols.map((c) => c.id);

  const toggleTop = (i: number, gid: string) => {
    setNav((prev) =>
      prev.map((it, idx) =>
        idx === i
          ? { ...it, allowedGrades: toggleGrade(it.allowedGrades, gid, allIds) }
          : it,
      ),
    );
    setNavDirty(true);
  };
  const toggleChild = (i: number, j: number, gid: string) => {
    setNav((prev) =>
      prev.map((it, idx) =>
        idx === i
          ? {
              ...it,
              children: it.children?.map((c, cj) =>
                cj === j
                  ? { ...c, allowedGrades: toggleGrade(c.allowedGrades, gid, allIds) }
                  : c,
              ),
            }
          : it,
      ),
    );
    setNavDirty(true);
  };
  const togglePage = (key: string, gid: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.key === key
          ? { ...p, allowed: toggleGrade(p.allowed, gid, allIds) }
          : p,
      ),
    );
    setDirtyPages((prev) => new Set(prev).add(key));
  };

  const save = async () => {
    setSaving(true);
    try {
      if (navDirty) {
        await updateDocFields(COLLECTIONS.SETTINGS, GLOBAL_SETTINGS_DOC_ID, {
          navItems: nav,
        });
      }
      for (const key of dirtyPages) {
        const p = pages.find((x) => x.key === key);
        if (!p) continue;
        const existing = await getSingletonDoc<PageDoc>(
          COLLECTIONS.SETTINGS,
          PAGE_DOC_ID(key),
        );
        if (existing) {
          await updateDocFields(COLLECTIONS.SETTINGS, PAGE_DOC_ID(key), {
            allowedGrades: p.allowed,
          });
        } else {
          const seed = ALL_PAGE_SEEDS.find((s) => s.key === key);
          await setSingletonDoc(COLLECTIONS.SETTINGS, PAGE_DOC_ID(key), {
            key,
            title: seed?.title ?? key,
            sections: seed?.sections ?? [],
            seoTitle: seed?.seoTitle ?? "",
            seoDescription: seed?.seoDescription ?? "",
            allowedGrades: p.allowed,
          });
        }
      }
      setNavDirty(false);
      setDirtyPages(new Set());
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );

  const dirty = navDirty || dirtyPages.size > 0;

  const Cell = ({
    checked,
    onToggle,
  }: {
    checked: boolean;
    onToggle: () => void;
  }) => (
    <td className="px-2 py-2 text-center">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-6 h-6 rounded border inline-flex items-center justify-center transition-colors",
          checked
            ? "bg-blue-600 border-blue-600 text-white"
            : "bg-white border-gray-300 hover:border-blue-400",
        )}
        aria-pressed={checked}
      >
        {checked && <Check className="w-4 h-4" />}
      </button>
    </td>
  );

  const RowLabel = ({
    children,
    depth = 0,
    allowed,
  }: {
    children: React.ReactNode;
    depth?: number;
    allowed: string[];
  }) => (
    <td
      className={cn(
        "px-3 py-2 text-sm font-medium text-gray-800 whitespace-nowrap",
        depth === 1 && "pl-8 text-gray-600",
      )}
    >
      {children}
      {(!allowed || allowed.length === 0) && (
        <span className="ml-2 text-[11px] text-gray-400">전체공개</span>
      )}
    </td>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          기본은 전부 체크(전체공개)입니다. 특정 등급에게 숨기려면 그 등급의 체크를
          해제하세요. (관리자는 항상 열람)
        </p>
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg">
              저장됨
            </span>
          )}
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            접근 설정 저장
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold text-gray-600">
                메뉴 · 페이지
              </th>
              {cols.map((g) => (
                <th
                  key={g.id}
                  className="px-2 py-2 text-xs font-bold text-gray-600 whitespace-nowrap"
                >
                  {g.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td
                colSpan={cols.length + 1}
                className="px-3 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wide"
              >
                상단 메뉴
              </td>
            </tr>
            {nav.map((item, i) => (
              <Fragment key={`m-${i}`}>
                <tr className="hover:bg-blue-50/40">
                  <RowLabel allowed={item.allowedGrades ?? []}>
                    {item.label}
                  </RowLabel>
                  {cols.map((g) => (
                    <Cell
                      key={g.id}
                      checked={isGradeChecked(item.allowedGrades, g.id)}
                      onToggle={() => toggleTop(i, g.id)}
                    />
                  ))}
                </tr>
                {item.children?.map((c, j) => (
                  <tr key={`m-${i}-${j}`} className="hover:bg-blue-50/40">
                    <RowLabel depth={1} allowed={c.allowedGrades ?? []}>
                      ↳ {c.label}
                    </RowLabel>
                    {cols.map((g) => (
                      <Cell
                        key={g.id}
                        checked={isGradeChecked(c.allowedGrades, g.id)}
                        onToggle={() => toggleChild(i, j, g.id)}
                      />
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}

            <tr>
              <td
                colSpan={cols.length + 1}
                className="px-3 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wide"
              >
                페이지
              </td>
            </tr>
            {pages.map((p) => (
              <tr key={`p-${p.key}`} className="hover:bg-blue-50/40">
                <RowLabel allowed={p.allowed}>{p.title}</RowLabel>
                {cols.map((g) => (
                  <Cell
                    key={g.id}
                    checked={isGradeChecked(p.allowed, g.id)}
                    onToggle={() => togglePage(p.key, g.id)}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
