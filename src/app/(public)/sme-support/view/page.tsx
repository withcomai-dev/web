"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ExternalLink, CalendarDays, Building2 } from "lucide-react";
import { COLLECTIONS, getDocById } from "@/lib/firestore";
import { SME_CATEGORY_LABELS } from "@/lib/constants";
import type { SmeSupportDoc } from "@/types/cms";
import { formatDate } from "@/lib/utils";

/** 중소기업 지원사업 상세 — /sme-support/view?id={문서ID} */
export default function SmeSupportViewPage() {
  const [item, setItem] = useState<SmeSupportDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      const id = new URLSearchParams(window.location.search).get("id");
      if (!id) {
        if (alive) {
          setItem(null);
          setLoading(false);
        }
        return;
      }
      let found: SmeSupportDoc | null = null;
      try {
        found = await getDocById<SmeSupportDoc>(COLLECTIONS.SME_SUPPORT, id);
      } catch {
        found = null;
      }
      if (alive) {
        // 게시 상태만 공개
        setItem(found && found.status === "published" ? found : null);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          지원사업을 찾을 수 없습니다
        </h1>
        <Link href="/sme-support" className="text-blue-600 hover:underline">
          ← 지원사업 목록으로
        </Link>
      </div>
    );
  }

  return (
    <article className="py-12 sm:py-16 bg-white min-h-[60vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/sme-support"
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← 지원사업 목록으로
        </Link>
        <header className="mb-10">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-4">
            {SME_CATEGORY_LABELS[item.category ?? "small-business"]}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-4 break-keep">
            {item.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
            {item.agency && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-400" /> 시행기관 {item.agency}
              </span>
            )}
            {item.deadline && (
              <span className="inline-flex items-center gap-1.5 text-rose-600 font-semibold">
                <CalendarDays className="w-4 h-4" /> 마감 {formatDate(item.deadline)}
              </span>
            )}
          </div>
          {item.summary && (
            <p className="mt-4 text-lg text-gray-500 break-keep">{item.summary}</p>
          )}
        </header>

        {item.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full rounded-2xl mb-10"
          />
        )}

        {item.bodyHtml && (
          <div
            className="prose-content mb-12"
            dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
          />
        )}

        {item.applyUrl && (
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-8 text-center">
            <p className="text-gray-700 font-semibold mb-4">
              자세한 신청 자격과 절차는 공식 페이지에서 확인하세요.
            </p>
            <a
              href={item.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
            >
              신청 페이지 바로가기 <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
