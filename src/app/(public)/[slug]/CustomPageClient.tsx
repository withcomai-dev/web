"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { COLLECTIONS, PAGE_DOC_ID, getSingletonDoc } from "@/lib/firestore";
import SectionRenderer from "@/components/sections/SectionRenderer";
import type { PageDoc, PageRegistry } from "@/types/cms";

const REGISTRY_DOC_ID = "pageRegistry";

/**
 * 정적 export 환경에서 커스텀 페이지를 런타임에 Firestore 에서 직접 읽어 렌더링.
 * → 빌드 시점에 생성된 페이지도 어드민에서 수정하면 즉시 반영된다.
 */
export default function CustomPageClient({ slug }: { slug: string }) {
  const [page, setPage] = useState<PageDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      const reg = await getSingletonDoc<PageRegistry>(
        COLLECTIONS.SETTINGS,
        REGISTRY_DOC_ID,
      );
      const norm = "/" + slug;
      const entry = reg?.pages?.find((p) => p.slug === norm);
      let pg: PageDoc | null = null;
      if (entry) {
        pg = await getSingletonDoc<PageDoc>(
          COLLECTIONS.SETTINGS,
          PAGE_DOC_ID(entry.key),
        );
      }
      if (alive) {
        setPage(pg);
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

  if (!page || !page.sections || page.sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-gray-500">요청하신 페이지가 존재하지 않습니다.</p>
      </div>
    );
  }

  return <SectionRenderer sections={page.sections} />;
}
