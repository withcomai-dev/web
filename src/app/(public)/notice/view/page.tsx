"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Pin } from "lucide-react";
import { COLLECTIONS, getDocById } from "@/lib/firestore";
import type { NoticeDoc } from "@/types/cms";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { canViewContent } from "@/lib/grades";
import AccessDenied from "@/components/sections/AccessDenied";

/** 공지사항 상세 — /notice/view?id={문서ID} */
export default function NoticeViewPage() {
  const [item, setItem] = useState<NoticeDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile, isAdmin, loading: authLoading } = useAuth();

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
      let found: NoticeDoc | null = null;
      try {
        found = await getDocById<NoticeDoc>(COLLECTIONS.NOTICES, id);
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
          공지사항을 찾을 수 없습니다
        </h1>
        <Link href="/notice" className="text-blue-600 hover:underline">
          ← 공지사항 목록으로
        </Link>
      </div>
    );
  }

  // 등급 게이팅 (요청 20260701 권한확장)
  if (!authLoading && !canViewContent(item.allowedGrades, profile?.grade, isAdmin, !!profile)) {
    return <AccessDenied />;
  }

  return (
    <article className="py-12 sm:py-16 bg-white min-h-[60vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/notice"
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← 공지사항 목록으로
        </Link>
        <header className="mb-10 border-b border-gray-100 pb-8">
          {item.pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 mb-4">
              <Pin className="w-3 h-3" /> 중요 공지
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-4 break-keep">
            {item.title}
          </h1>
          {item.publishedAt && (
            <p className="text-sm text-gray-500">{formatDate(item.publishedAt)}</p>
          )}
        </header>
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
        />
      </div>
    </article>
  );
}
