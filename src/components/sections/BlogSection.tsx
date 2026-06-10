"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { COLLECTIONS, getCollection } from "@/lib/firestore";
import { formatDate } from "@/lib/utils";
import type { BlogData, BlogPostItem, ContentDoc } from "@/types/cms";

/**
 * 업무활용 콘텐츠 섹션.
 * - source "auto"(기본): 어드민 [콘텐츠]의 최신 게시글 3개를 자동 표시 (재배포 불필요)
 * - source "manual": 페이지·섹션 에디터에서 직접 구성한 항목 표시
 * - 자동 모드에서 게시글이 없으면 구성된 항목(시드)을 예비로 표시
 */
export default function BlogSection({ data }: { data: BlogData }) {
  const [liveItems, setLiveItems] = useState<BlogPostItem[] | null>(null);

  useEffect(() => {
    if (data.source === "manual") {
      setLiveItems(null);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const docs = await getCollection<ContentDoc>(COLLECTIONS.CONTENTS);
        const latest = docs
          .filter((d) => d.status === "published")
          .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
          .slice(0, 3)
          .map<BlogPostItem>((d) => ({
            category: d.category,
            date: d.publishedAt ? formatDate(d.publishedAt) : "",
            title: d.title,
            summary: d.summary ?? "",
            thumbnail: d.thumbnail ?? "",
            href: `/contents/view?slug=${encodeURIComponent(d.slug)}`,
          }));
        if (alive && latest.length > 0) setLiveItems(latest);
      } catch {
        // Firestore 미접속 시 구성 항목 유지
      }
    })();
    return () => {
      alive = false;
    };
  }, [data.source]);

  const items = liveItems ?? data.items;

  return (
    <section className="py-16 sm:py-24 bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-2 mb-10 sm:mb-12">
          <div>
            {data.eyebrow && (
              <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
                {data.eyebrow}
              </h2>
            )}
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              {data.title}
            </p>
          </div>
          {data.viewAllHref && (
            <Link
              href={data.viewAllHref}
              className="mt-4 md:mt-0 text-blue-600 font-bold flex items-center hover:underline"
            >
              전체 보기 <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, i) => {
            const Wrapper = item.href ? Link : "article";
            const wrapperProps = item.href
              ? { href: item.href }
              : ({} as Record<string, never>);
            return (
              // @ts-expect-error - dynamic component selection
              <Wrapper
                key={i}
                {...wrapperProps}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer block"
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
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">{item.date}</p>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2">{item.summary}</p>
                </div>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
