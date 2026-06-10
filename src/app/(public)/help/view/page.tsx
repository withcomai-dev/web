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
import type { HelpDoc } from "@/types/cms";
import { formatDate } from "@/lib/utils";

export default function HelpViewPage() {
  const [slug, setSlug] = useState<string | null>(null);
  const [doc, setDoc] = useState<HelpDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    setSlug(s);
  }, []);

  useEffect(() => {
    if (slug === null) return;
    if (!slug) {
      setDoc(null);
      setLoading(false);
      return;
    }
    let alive = true;
    void (async () => {
      setLoading(true);
      let found: HelpDoc | null = null;
      try {
        const docs = await getQueriedCollection<HelpDoc>(
          COLLECTIONS.HELP_DOCS,
          [where("slug", "==", slug), limit(1)],
        );
        found = docs[0] ?? null;
      } catch {
        found = null;
      }
      if (alive) {
        setDoc(found && found.status === "published" ? found : null);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          도움말을 찾을 수 없습니다
        </h1>
        <Link href="/help" className="text-blue-600 hover:underline">
          ← 도움말 센터
        </Link>
      </div>
    );
  }

  return (
    <article className="py-16 bg-white min-h-[60vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/help"
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← 도움말 센터
        </Link>
        <header className="mb-10 pb-6 border-b border-gray-100">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-4">
            {doc.category}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">{doc.title}</h1>
          {doc.updatedAt && (
            <p className="mt-2 text-sm text-gray-400">
              최종 업데이트: {formatDate(doc.updatedAt)}
            </p>
          )}
        </header>
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
        />
      </div>
    </article>
  );
}
