"use client";

import Link from "next/link";
import { Search, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

/** 콘텐츠/AI TOOL 목록 정렬 기준 (요청 20260701 #7) */
export type ContentSort = "latest" | "title" | "views";

export const SORT_LABELS: Record<ContentSort, string> = {
  latest: "최신순",
  title: "제목순",
  views: "조회순",
};

export type ListView = "grid" | "list";

/** 검색어(제목·요약) 필터 + 정렬 적용. 원본 배열은 변형하지 않는다. */
export function processList<
  T extends {
    title: string;
    summary?: string;
    category?: string;
    publishedAt?: string;
    viewCount?: number;
  },
>(items: T[], query: string, sort: ContentSort): T[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          (it.summary ?? "").toLowerCase().includes(q) ||
          (it.category ?? "").toLowerCase().includes(q),
      )
    : items;

  const sorted = [...filtered];
  if (sort === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title, "ko"));
  } else if (sort === "views") {
    sorted.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
  } else {
    sorted.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  }
  return sorted;
}

/** 검색 + 정렬 + 뷰 전환(카드/제목만) 툴바 */
export function ListToolbar({
  query,
  onQuery,
  sort,
  onSort,
  view,
  onView,
  placeholder = "제목·내용 검색",
}: {
  query: string;
  onQuery: (v: string) => void;
  sort: ContentSort;
  onSort: (v: ContentSort) => void;
  view: ListView;
  onView: (v: ListView) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          aria-label="검색"
        />
      </div>

      <select
        value={sort}
        onChange={(e) => onSort(e.target.value as ContentSort)}
        className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:border-blue-400 focus:outline-none"
        aria-label="정렬 기준"
      >
        {(["latest", "title", "views"] as ContentSort[]).map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>

      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shrink-0">
        <button
          type="button"
          onClick={() => onView("grid")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-colors",
            view === "grid" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-blue-600",
          )}
        >
          <LayoutGrid className="w-4 h-4" /> 카드
        </button>
        <button
          type="button"
          onClick={() => onView("list")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-colors",
            view === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-blue-600",
          )}
        >
          <List className="w-4 h-4" /> 제목만 보기
        </button>
      </div>
    </div>
  );
}

/** "제목만 보기" 리스트형 렌더 — 썸네일 없이 제목·분류·날짜 행 */
export function ListRows({
  rows,
}: {
  rows: {
    href: string;
    title: string;
    category?: string;
    date?: string;
    pinned?: boolean;
  }[];
}) {
  return (
    <ul className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-sm">
      {rows.map((r, i) => (
        <li key={i}>
          <Link
            href={r.href}
            className="flex items-center gap-3 px-5 py-4 hover:bg-blue-50/50 transition-colors group"
          >
            {r.category && (
              <span className="shrink-0 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                {r.category}
              </span>
            )}
            {r.pinned && (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold">
                고정
              </span>
            )}
            <span className="flex-1 min-w-0 truncate font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
              {r.title}
            </span>
            {r.date && (
              <span className="hidden sm:block shrink-0 text-sm text-gray-400">
                {r.date}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
