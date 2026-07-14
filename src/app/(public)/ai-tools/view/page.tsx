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
import { AI_TOOL_CATEGORY_LABELS } from "@/lib/constants";
import type { AiToolDoc } from "@/types/cms";
import { formatDate } from "@/lib/utils";
import { trackContentView } from "@/lib/track";

/** AI TOOL 소개 게시글 상세 (?slug= 쿼리) */
export default function AiToolViewPage() {
  const [item, setItem] = useState<AiToolDoc | null>(null);
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
      let found: AiToolDoc | null = null;
      try {
        const docs = await getQueriedCollection<AiToolDoc>(
          COLLECTIONS.AI_TOOLS,
          [where("slug", "==", slug), limit(1)],
        );
        found = docs[0] ?? null;
      } catch {
        found = null;
      }
      if (found && found.status === "published" && found.id) {
        trackContentView(COLLECTIONS.AI_TOOLS, found.id);
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
          글을 찾을 수 없습니다
        </h1>
        <Link href="/ai-tools" className="text-blue-600 hover:underline">
          ← AI TOOL 소개 목록으로
        </Link>
      </div>
    );
  }

  const backHref = `/ai-tools?cat=${encodeURIComponent(item.category)}`;

  return (
    <article className="py-12 sm:py-16 bg-white min-h-[60vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← AI TOOL 소개 목록으로
        </Link>
        <header className="mb-10">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-4">
            {AI_TOOL_CATEGORY_LABELS[item.category] ?? item.category}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
            {item.title}
          </h1>
          {item.publishedAt && (
            <p className="text-sm text-gray-500">{formatDate(item.publishedAt)}</p>
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
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
        />
      </div>
    </article>
  );
}
