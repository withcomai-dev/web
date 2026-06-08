"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { COLLECTIONS, getCollection } from "@/lib/firestore";
import {
  SME_CATEGORY_LABELS,
  SME_CATEGORY_ORDER,
} from "@/lib/constants";
import type { SmeSupportDoc, SmeCategory } from "@/types/cms";

function sortByOrder(list: SmeSupportDoc[]): SmeSupportDoc[] {
  return [...list].sort((a, b) => {
    const sa = a.sortOrder ?? 9999;
    const sb = b.sortOrder ?? 9999;
    if (sa !== sb) return sa - sb;
    return (a.deadline ?? "").localeCompare(b.deadline ?? "");
  });
}

function SmeCard({ item }: { item: SmeSupportDoc }) {
  const inner = (
    <>
      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">
            이미지 준비중
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        {item.agency && (
          <p className="text-xs font-semibold text-blue-600 mb-2">{item.agency}</p>
        )}
        <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {item.title}
        </h4>
        {item.summary && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.summary}</p>
        )}
        <div className="mt-auto flex items-center justify-between text-sm">
          {item.deadline ? (
            <span className="text-rose-600 font-semibold">마감 {item.deadline}</span>
          ) : (
            <span />
          )}
          {item.applyUrl && (
            <span className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:gap-2 transition-all">
              자세히 보기 <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </>
  );

  const cardClass =
    "group flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow";

  // 새 창으로 열기 (외부 링크)
  return item.applyUrl ? (
    <a
      href={item.applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cardClass}
    >
      {inner}
    </a>
  ) : (
    <article className={cardClass}>{inner}</article>
  );
}

export default function SmeSupportList({
  limitPerCategory,
  showViewAll = false,
  hideWhenEmpty = false,
  eyebrow,
  heading,
  description,
  sectionClassName,
}: {
  /** 카테고리별 최대 노출 개수 (메인 페이지 등 요약 노출용) */
  limitPerCategory?: number;
  /** 전체 보기 링크(/sme-support) 노출 여부 */
  showViewAll?: boolean;
  /** 노출할 항목이 없으면 아무것도 렌더링하지 않음 (메인 페이지용) */
  hideWhenEmpty?: boolean;
  /** 상단 헤더(선택) */
  eyebrow?: string;
  heading?: string;
  description?: string;
  /** 지정 시 자체 <section> 래퍼로 감쌈 (메인 페이지용) */
  sectionClassName?: string;
} = {}) {
  const [items, setItems] = useState<SmeSupportDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      let list: SmeSupportDoc[] = [];
      try {
        const docs = await getCollection<SmeSupportDoc>(COLLECTIONS.SME_SUPPORT);
        list = docs.filter((i) => i.status === "published");
      } catch {
        list = [];
      }
      if (alive) {
        setItems(list);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    // 메인 페이지(hideWhenEmpty)에서는 로딩 중 공간을 차지하지 않음
    if (hideWhenEmpty) return null;
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const grouped: { category: SmeCategory; list: SmeSupportDoc[] }[] =
    SME_CATEGORY_ORDER.map((category) => {
      let list = sortByOrder(
        items.filter((i) => (i.category ?? "small-business") === category),
      );
      if (limitPerCategory) list = list.slice(0, limitPerCategory);
      return { category, list };
    }).filter((g) => g.list.length > 0);

  if (grouped.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <p className="text-gray-500 text-center py-12">
        등록된 지원사업이 없습니다.
      </p>
    );
  }

  const content = (
    <div className="space-y-14">
      {(eyebrow || heading || description) && (
        <div className="text-center">
          {eyebrow && (
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
              {eyebrow}
            </h2>
          )}
          {heading && (
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {heading}
            </p>
          )}
          {description && (
            <p className="mt-4 max-w-2xl text-lg text-gray-500 mx-auto">
              {description}
            </p>
          )}
        </div>
      )}
      {grouped.map(({ category, list }) => (
        <section key={category}>
          <div className="flex items-end justify-between mb-6">
            <h3 className="text-2xl font-extrabold text-gray-900">
              {SME_CATEGORY_LABELS[category]}
            </h3>
            {showViewAll && (
              <Link
                href="/sme-support"
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                전체 보기 →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((item) => (
              <SmeCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  if (sectionClassName) {
    return (
      <section className={sectionClassName}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{content}</div>
      </section>
    );
  }

  return content;
}
