"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, ExternalLink } from "lucide-react";
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
  // 지원사업 사이트 URL이 있으면 카드(썸네일) 클릭 시 외부 사이트로 새 탭 이동,
  // 없으면 기존 내부 상세 페이지로 폴백
  const external = !!item.applyUrl && /^https?:\/\//.test(item.applyUrl);

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
          <span className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:gap-2 transition-all">
            {external ? (
              <>
                사이트 바로가기 <ExternalLink className="w-4 h-4" />
              </>
            ) : (
              <>
                자세히 보기 <ArrowRight className="w-4 h-4" />
              </>
            )}
          </span>
        </div>
      </div>
    </>
  );

  const cardClass =
    "group flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow";

  if (external) {
    return (
      <a
        href={item.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={`/sme-support/view?id=${item.id}`} className={cardClass}>
      {inner}
    </Link>
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
  category,
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
  /** 특정 카테고리만 노출 (카테고리 전용 페이지용) */
  category?: SmeCategory;
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

  // 공통 헤더 (eyebrow/heading/description)
  const header =
    eyebrow || heading || description ? (
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
    ) : null;

  // 섹션 래퍼 (sectionClassName 지정 시 자체 <section> 으로 감쌈)
  const wrap = (inner: ReactNode) =>
    sectionClassName ? (
      <section className={sectionClassName}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">{inner}</div>
      </section>
    ) : (
      <>{inner}</>
    );

  if (loading) {
    // 메인 페이지(hideWhenEmpty)에서는 로딩 중 공간을 차지하지 않음
    if (hideWhenEmpty) return null;
    return wrap(
      <div className="space-y-12">
        {header}
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>,
    );
  }

  // category 지정 시 해당 카테고리만 대상으로 한다 (카테고리 전용 페이지)
  const targetCategories = category ? [category] : SME_CATEGORY_ORDER;

  const grouped: { category: SmeCategory; list: SmeSupportDoc[] }[] =
    targetCategories.map((cat) => {
      let list = sortByOrder(
        items.filter((i) => (i.category ?? "small-business") === cat),
      );
      if (limitPerCategory) list = list.slice(0, limitPerCategory);
      return { category: cat, list };
    }).filter((g) => g.list.length > 0);

  // 등록 항목이 없을 때: hideWhenEmpty면 숨김, 아니면 섹션 구조 + 준비중 안내 노출
  if (grouped.length === 0) {
    if (hideWhenEmpty) return null;
    return wrap(
      <div className="space-y-12">
        {header}
        <div
          className={
            targetCategories.length > 1
              ? "grid grid-cols-1 md:grid-cols-2 gap-6"
              : "grid grid-cols-1 gap-6"
          }
        >
          {targetCategories.map((cat) => (
            <div key={cat}>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-4">
                {SME_CATEGORY_LABELS[cat]}
              </h3>
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center text-sm text-gray-400">
                지원사업 정보를 준비 중입니다.
              </div>
            </div>
          ))}
        </div>
      </div>,
    );
  }

  return wrap(
    <div className="space-y-14">
      {header}
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
    </div>,
  );
}
