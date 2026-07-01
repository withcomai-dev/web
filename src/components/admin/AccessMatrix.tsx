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
import { loadMemberGrades } from "@/lib/grades";
import { loadRegistry } from "@/lib/page-registry";
import { ALL_PAGE_SEEDS } from "@/lib/seed-data";
import type { MemberGrade, GlobalSettings, PageDoc } from "@/types/cms";
import { cn } from "@/lib/utils";

type NavItems = NonNullable<GlobalSettings["navItems"]>;

/** id 토글 헬퍼 */
function toggleId(arr: string[] | undefined, id: string): string[] {
  const a = arr ?? [];
  return a.includes(id) ? a.filter((x) => x !== id) : [...a, id];
}

/**
 * 등급별 접근 매트릭스 (요청 20260701 권한확장 ①):
 * 행=상단 메뉴(+서브메뉴)·페이지 / 열=회원 등급. 체크한 등급만 열람.
 * 아무것도 체크 안 하면 전체공개. 관리자는 항상 열람.
 */
export default function AccessMatrix() {
  const [grades, setGrades] = useState<MemberGrade[]>([]);
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
      const [g, settings, reg] = await Promise.all([
        loadMemberGrades(),
        getSingletonDoc<GlobalSettings>(
          COLLECTIONS.SETTINGS,
          GLOBAL_SETTINGS_DOC_ID,
        ),
        loadRegistry(),
      ]);
      setGrades(g);
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

  const toggleTop = (i: number, gid: string) => {
    setNav((prev) =>
      prev.map((it, idx) =>
        idx === i ? { ...it, allowedGrades: toggleId(it.allowedGrades, gid) } : it,
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
                  ? { ...c, allowedGrades: toggleId(c.allowedGrades, gid) }
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
        p.key === key ? { ...p, allowed: toggleId(p.allowed, gid) } : p,
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
          // Firestore 문서가 아직 없으면 시드 본문 + 등급으로 생성
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

  if (grades.length === 0)
    return (
      <p className="text-sm text-gray-400 py-4">
        먼저 위에서 회원 등급을 만들고 저장하면, 등급별 접근 설정표가 나타납니다.
      </p>
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
      {allowed.length === 0 && (
        <span className="ml-2 text-[11px] text-gray-400">전체공개</span>
      )}
    </td>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          체크한 등급만 해당 메뉴·페이지를 볼 수 있습니다. 아무것도 체크하지 않으면
          전체공개. (관리자는 항상 열람)
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
              {grades.map((g) => (
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
                colSpan={grades.length + 1}
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
                  {grades.map((g) => (
                    <Cell
                      key={g.id}
                      checked={(item.allowedGrades ?? []).includes(g.id)}
                      onToggle={() => toggleTop(i, g.id)}
                    />
                  ))}
                </tr>
                {item.children?.map((c, j) => (
                  <tr key={`m-${i}-${j}`} className="hover:bg-blue-50/40">
                    <RowLabel depth={1} allowed={c.allowedGrades ?? []}>
                      ↳ {c.label}
                    </RowLabel>
                    {grades.map((g) => (
                      <Cell
                        key={g.id}
                        checked={(c.allowedGrades ?? []).includes(g.id)}
                        onToggle={() => toggleChild(i, j, g.id)}
                      />
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}

            <tr>
              <td
                colSpan={grades.length + 1}
                className="px-3 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wide"
              >
                페이지
              </td>
            </tr>
            {pages.map((p) => (
              <tr key={`p-${p.key}`} className="hover:bg-blue-50/40">
                <RowLabel allowed={p.allowed}>{p.title}</RowLabel>
                {grades.map((g) => (
                  <Cell
                    key={g.id}
                    checked={p.allowed.includes(g.id)}
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
