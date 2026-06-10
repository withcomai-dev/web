"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { COLLECTIONS, getOrderedCollection } from "@/lib/firestore";
import type { HelpDoc } from "@/types/cms";
import { HELP_CATEGORIES } from "@/lib/constants";
import { PageBanner } from "@/components/sections/HeroSection";

export default function HelpIndex() {
  const [docs, setDocs] = useState<HelpDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      let result: HelpDoc[] = [];
      try {
        const all = await getOrderedCollection<HelpDoc>(
          COLLECTIONS.HELP_DOCS,
          "order",
          "asc",
        );
        result = all.filter(
          (d) =>
            d.status === "published" &&
            (d.audience === "public" || d.audience === "both"),
        );
      } catch {
        result = [];
      }
      if (alive) {
        setDocs(result);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <PageBanner
        eyebrow="Help Center"
        title='궁금한 점을 빠르게,<br class="hidden sm:block"/> <span class="text-blue-400">도움말 센터</span>'
        subtitle="사이트 이용, 회원·로그인, 쇼핑몰, 문의·상담 — 자주 묻는 내용을 카테고리별로 모았습니다."
      />
      <div className="py-12 sm:py-16 bg-slate-50 min-h-[60vh]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : docs.length === 0 ? (
          <p className="text-center text-gray-500 py-20">
            등록된 도움말이 없습니다.
          </p>
        ) : (
          <div className="space-y-10">
            {HELP_CATEGORIES.map((cat) => {
              const items = docs.filter((d) => d.category === cat);
              if (items.length === 0) return null;
              return (
                <section key={cat}>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{cat}</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((doc) => (
                      <li key={doc.id}>
                        <Link
                          href={`/help/view?slug=${encodeURIComponent(doc.slug)}`}
                          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          {doc.thumbnail ? (
                            <img
                              src={doc.thumbnail}
                              alt=""
                              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-blue-50 flex-shrink-0" />
                          )}
                          <p className="font-semibold text-gray-900 line-clamp-2">{doc.title}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
