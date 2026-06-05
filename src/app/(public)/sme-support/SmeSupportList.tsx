"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { COLLECTIONS, getOrderedCollection } from "@/lib/firestore";
import type { SmeSupportDoc } from "@/types/cms";
import { formatDate } from "@/lib/utils";

export default function SmeSupportList() {
  const [items, setItems] = useState<SmeSupportDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      let list: SmeSupportDoc[] = [];
      try {
        const docs = await getOrderedCollection<SmeSupportDoc>(
          COLLECTIONS.SME_SUPPORT,
          "deadline",
          "asc",
        );
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

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">진행 중인 지원사업</h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            등록된 지원사업이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <p className="text-xs text-blue-600 font-semibold mb-2">
                  {item.agency ?? "공공기관"}
                </p>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                {item.summary && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {item.summary}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  {item.deadline && (
                    <span className="text-rose-600 font-semibold">
                      마감 {formatDate(item.deadline)}
                    </span>
                  )}
                  {item.applyUrl && (
                    <Link
                      href={item.applyUrl}
                      target="_blank"
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      신청하기 →
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
