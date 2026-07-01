"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { COLLECTIONS, getCollection } from "@/lib/firestore";
import { AI_TOOL_CATEGORIES } from "@/lib/constants";
import type { AiToolCategory, AiToolDoc } from "@/types/cms";
import { formatDate, htmlToPlainTextSummary, cn } from "@/lib/utils";
import { PageBanner } from "@/components/sections/HeroSection";
import {
  ListToolbar,
  ListRows,
  processList,
  type ContentSort,
  type ListView,
} from "@/components/sections/ListToolbar";

const DEFAULT_CATEGORY: AiToolCategory = AI_TOOL_CATEGORIES[0].slug;

function isCategory(v: string | null): v is AiToolCategory {
  return !!v && AI_TOOL_CATEGORIES.some((c) => c.slug === v);
}

/**
 * AI TOOL 소개 게시판 — 스마트워크&AI 페이지 6개 카드와 연결.
 * 카테고리 탭 + 해당 카테고리 게시글 카드 리스트 (?cat= 쿼리로 진입).
 * 검색·정렬·제목만 보기 지원 (요청 20260701 #7).
 */
export default function AiToolsPage() {
  const [items, setItems] = useState<AiToolDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<AiToolCategory>(DEFAULT_CATEGORY);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ContentSort>("latest");
  const [view, setView] = useState<ListView>("grid");

  // URL ?cat= 에서 초기 카테고리 결정 (useSearchParams 대신 — Suspense 불필요)
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("cat");
    if (isCategory(fromUrl)) setCat(fromUrl);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      let docs: AiToolDoc[] = [];
      try {
        const all = await getCollection<AiToolDoc>(COLLECTIONS.AI_TOOLS);
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

  const selectTab = (slug: AiToolCategory) => {
    setCat(slug);
    // 새로고침·공유 시에도 같은 탭이 열리도록 URL 동기화 (리로드 없음)
    window.history.replaceState(null, "", `/ai-tools?cat=${slug}`);
  };

  const active = AI_TOOL_CATEGORIES.find((c) => c.slug === cat) ?? AI_TOOL_CATEGORIES[0];
  const inCategory = items.filter((d) => d.category === cat);
  const processed = processList(inCategory, query, sort);

  return (
    <>
      <PageBanner
        eyebrow="AI Tools"
        title='업무에 바로 쓰는<br class="hidden sm:block"/> <span class="text-blue-400">AI TOOL 소개</span>'
        subtitle="생성형 AI부터 협업·자동화 도구까지 — 중소기업 실무에 맞는 도구를 골라 소개합니다."
      />
      <section className="py-12 sm:py-16 bg-slate-50 min-h-[60vh]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* 카테고리 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
            {AI_TOOL_CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => selectTab(c.slug)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors",
                  c.slug === cat
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="text-gray-500 mb-6">{active.description}</p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <ListToolbar
                query={query}
                onQuery={setQuery}
                sort={sort}
                onSort={setSort}
                view={view}
                onView={setView}
                placeholder="AI TOOL 검색"
              />

              {processed.length === 0 ? (
                <p className="text-center text-gray-500 py-20">
                  {query
                    ? `“${query}” 검색 결과가 없습니다.`
                    : "아직 등록된 소개 글이 없습니다. 곧 유용한 도구 소개로 찾아뵙겠습니다."}
                </p>
              ) : view === "list" ? (
                <ListRows
                  rows={processed.map((item) => ({
                    href: `/ai-tools/view?slug=${encodeURIComponent(item.slug)}`,
                    title: item.title,
                    category: active.label,
                    date: item.publishedAt ? formatDate(item.publishedAt) : undefined,
                  }))}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {processed.map((item) => (
                    <Link
                      key={item.id}
                      href={`/ai-tools/view?slug=${encodeURIComponent(item.slug)}`}
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
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                            {active.label}
                          </span>
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
