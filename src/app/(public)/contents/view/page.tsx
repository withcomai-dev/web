"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  COLLECTIONS,
  getQueriedCollection,
  where,
  limit,
} from "@/lib/firestore";
import type { ContentDoc } from "@/types/cms";
import { formatDate } from "@/lib/utils";

export default function ContentViewPage() {
  const [item, setItem] = useState<ContentDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      const slug = new URLSearchParams(window.location.search).get("slug");
      if (!slug) {
        if (alive) {
          setItem(null);
          setLoading(false);
        }
        return;
      }
      let found: ContentDoc | null = null;
      try {
        const docs = await getQueriedCollection<ContentDoc>(
          COLLECTIONS.CONTENTS,
          [where("slug", "==", slug), limit(1)],
        );
        found = docs[0] ?? null;
      } catch {
        found = null;
      }
      if (alive) {
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
          콘텐츠를 찾을 수 없습니다
        </h1>
        <Link href="/contents" className="text-blue-600 hover:underline">
          ← 콘텐츠 목록으로
        </Link>
      </div>
    );
  }

  return (
    <article className="py-16 bg-white min-h-[60vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/contents"
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← 콘텐츠 목록으로
        </Link>
        <header className="mb-10">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-4">
            {item.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            {item.title}
          </h1>
          {item.publishedAt && (
            <p className="text-sm text-gray-500">{formatDate(item.publishedAt)}</p>
          )}
        </header>
        {item.thumbnail && (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full rounded-2xl mb-10"
          />
        )}
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
        />
      </div>
    </article>
  );
}
