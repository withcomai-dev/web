"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Pin, ChevronRight } from "lucide-react";
import { COLLECTIONS, getCollection } from "@/lib/firestore";
import type { NoticeDoc } from "@/types/cms";
import { formatDate } from "@/lib/utils";
import { PageBanner } from "@/components/sections/HeroSection";
import { useAuth } from "@/contexts/AuthContext";
import { canViewContent } from "@/lib/grades";

/** 고정 공지 먼저, 그다음 게시일 내림차순 */
function sortNotices(list: NoticeDoc[]): NoticeDoc[] {
  return [...list].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
  });
}

export default function NoticePage() {
  const [items, setItems] = useState<NoticeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    let alive = true;
    void (async () => {
      let docs: NoticeDoc[] = [];
      try {
        const all = await getCollection<NoticeDoc>(COLLECTIONS.NOTICES);
        docs = sortNotices(all.filter((d) => d.status === "published"));
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

  // 등급별 노출 필터 (요청 20260701 권한확장) — 로딩 중엔 전체(fail-open)
  const visible = authLoading
    ? items
    : items.filter((it) =>
        canViewContent(it.allowedGrades, profile?.grade, isAdmin),
      );

  return (
    <>
      <PageBanner
        eyebrow="Notice"
        title='WITHCOM AI의 새로운 소식,<br class="hidden sm:block"/> <span class="text-blue-400">공지사항</span>'
        subtitle="서비스 안내, 점검 일정, 행사 소식 등 WITHCOM AI의 공식 공지를 전해드립니다."
      />
      <section className="py-12 sm:py-16 bg-slate-50 min-h-[60vh]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : visible.length === 0 ? (
            <p className="text-center text-gray-500 py-20">
              등록된 공지사항이 없습니다.
            </p>
          ) : (
            <ul className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {visible.map((it) => (
                <li key={it.id}>
                  <Link
                    href={`/notice/view?id=${it.id}`}
                    className="group flex items-center gap-3 sm:gap-5 px-5 sm:px-8 py-5 hover:bg-blue-50/50 transition-colors"
                  >
                    {it.pinned ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                        <Pin className="w-3 h-3" /> 중요
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        공지
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {it.title}
                    </span>
                    <span className="hidden sm:block shrink-0 text-sm text-gray-400">
                      {it.publishedAt ? formatDate(it.publishedAt) : ""}
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
