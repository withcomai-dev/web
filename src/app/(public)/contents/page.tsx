"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  COLLECTIONS,
  getOrderedCollection,
} from "@/lib/firestore";
import type { ContentDoc } from "@/types/cms";
import { formatDate, htmlToPlainTextSummary } from "@/lib/utils";
import { PageBanner } from "@/components/sections/HeroSection";
import {
  ListToolbar,
  ListRows,
  processList,
  type ContentSort,
  type ListView,
} from "@/components/sections/ListToolbar";
import { useAuth } from "@/contexts/AuthContext";
import { canViewContent } from "@/lib/grades";

export default function ContentsPage() {
  const [items, setItems] = useState<ContentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  // 검색·정렬·뷰 (요청 20260701 #7) — 기본 최신순 / 카드
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ContentSort>("latest");
  const [view, setView] = useState<ListView>("grid");
  // 회원 등급 게이팅 (요청 20260701 #8) — 로딩 중엔 필터 생략(fail-open)
  const { profile, isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      let docs: ContentDoc[] = [];
      try {
        const all = await getOrderedCollection<ContentDoc>(
          COLLECTIONS.CONTENTS,
          "publishedAt",
          "desc",
        );
        docs = all.filter((d) => d.status === "published");
      } catch {
        docs = [];
      }
      if (alive) {
        setItems(docs);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 등급 게이팅 → 검색·정렬. 최신순일 때는 고정(pinned) 글을 항상 먼저.
  const visible = authLoading
    ? items
    : items.filter((it) =>
        canViewContent(it.allowedGrades, profile?.grade, isAdmin, !!profile),
      );
  const base = processList(visible, query, sort);
  const processed =
    sort === "latest"
      ? [...base].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
      : base;

  return (
    <>
      <PageBanner
        eyebrow="Contents"
        title='실무에 바로 쓰는<br class="hidden sm:block"/> <span class="text-blue-400">업무활용 콘텐츠</span>'
        subtitle="AI 활용 팁, 스마트워크 도입 사례, IT 트렌드 — 중소기업 실무에 도움되는 콘텐츠를 전합니다."
      />
      <section className="py-12 sm:py-16 bg-slate-50 min-h-[60vh]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-500 py-20">
              등록된 콘텐츠가 없습니다.
            </p>
          ) : (
            <>
              <ListToolbar
                query={query}
                onQuery={setQuery}
                sort={sort}
                onSort={setSort}
                view={view}
                onView={setView}
              />

              {processed.length === 0 ? (
                <p className="text-center text-gray-500 py-20">
                  “{query}” 검색 결과가 없습니다.
                </p>
              ) : view === "list" ? (
                <ListRows
                  rows={processed.map((item) => ({
                    href: `/contents/view?slug=${encodeURIComponent(item.slug)}`,
                    title: item.title,
                    category: item.category,
                    date: item.publishedAt ? formatDate(item.publishedAt) : undefined,
                    pinned: item.pinned,
                  }))}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {processed.map((item) => (
                    <Link
                      key={item.id}
                      href={`/contents/view?slug=${encodeURIComponent(item.slug)}`}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                    >
                      <div className="relative h-56 overflow-hidden bg-slate-100">
                        {item.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">
                            이미지 준비중
                          </div>
                        )}
                        <div className="absolute top-4 left-4 flex items-center gap-1.5">
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                            {item.category}
                          </span>
                          {item.pinned && (
                            <span className="px-3 py-1 bg-slate-900/80 text-white text-xs font-bold rounded-full">
                              고정
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-6">
                        {item.publishedAt && (
                          <p className="text-sm text-gray-400 mb-2">
                            {formatDate(item.publishedAt)}
                          </p>
                        )}
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2">
                          {item.summary ?? htmlToPlainTextSummary(item.bodyHtml)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
