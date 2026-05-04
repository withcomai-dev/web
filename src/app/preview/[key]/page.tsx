"use client";

import { useEffect, useState, use } from "react";
import { Loader2 } from "lucide-react";
import {
  COLLECTIONS,
  PAGE_DOC_ID,
  getSingletonDoc,
} from "@/lib/firestore";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { ALL_PAGE_SEEDS } from "@/lib/seed-data";
import type { PageDoc } from "@/types/cms";

/**
 * 새 탭에서 페이지를 미리 본다.
 * - ?draft=1 + sessionStorage 의 임시 데이터를 우선 사용
 * - sessionStorage 키: withcom.preview.<key>
 */
export default function PreviewPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = use(params);
  const [page, setPage] = useState<PageDoc | null>(null);
  const [source, setSource] = useState<"draft" | "saved" | "seed">("seed");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        // 1) Try draft from sessionStorage
        if (typeof window !== "undefined") {
          const draftRaw = sessionStorage.getItem(`withcom.preview.${key}`);
          if (draftRaw) {
            const draft = JSON.parse(draftRaw) as PageDoc;
            setPage(draft);
            setSource("draft");
            setLoading(false);
            return;
          }
        }

        // 2) Saved doc
        const remote = await getSingletonDoc<PageDoc>(
          COLLECTIONS.SETTINGS,
          PAGE_DOC_ID(key),
        );
        if (remote && remote.sections) {
          setPage(remote);
          setSource("saved");
          setLoading(false);
          return;
        }
      } catch {
        // fallthrough to seed
      }

      // 3) Seed fallback
      const seed = ALL_PAGE_SEEDS.find((p) => p.key === key);
      setPage(seed ?? null);
      setSource("seed");
      setLoading(false);
    })();
  }, [key]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        페이지를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <>
      <div
        className={
          "fixed top-0 inset-x-0 z-[60] py-1.5 text-center text-xs font-semibold shadow " +
          (source === "draft"
            ? "bg-amber-400 text-amber-950"
            : source === "saved"
              ? "bg-emerald-500 text-white"
              : "bg-gray-700 text-white")
        }
      >
        🔍 미리보기 ·{" "}
        {source === "draft"
          ? "초안 (저장되지 않음)"
          : source === "saved"
            ? "현재 게시본"
            : "시드 데이터 (Firestore 미연결)"}{" "}
        — {page.title}
      </div>
      <main className="pt-8">
        <SectionRenderer sections={page.sections} />
      </main>
    </>
  );
}
