"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, FileText, Megaphone, Briefcase, Bot, Loader2 } from "lucide-react";
import { COLLECTIONS, getCollection } from "@/lib/firestore";
import { AI_TOOL_CATEGORY_LABELS } from "@/lib/constants";
import type {
  AiToolDoc,
  ContentDoc,
  NoticeDoc,
  SmeSupportDoc,
} from "@/types/cms";
import { htmlToPlainTextSummary } from "@/lib/utils";

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  type: "content" | "notice" | "sme" | "aiTool";
  href: string;
}

const TYPE_ICON = {
  content: FileText,
  notice: Megaphone,
  sme: Briefcase,
  aiTool: Bot,
} as const;

const TYPE_LABEL: Record<SearchItem["type"], string> = {
  content: "업무활용 콘텐츠",
  notice: "공지사항",
  sme: "지원사업",
  aiTool: "AI TOOL 소개",
};

/**
 * 공개 사이트 통합 검색 오버레이.
 * 게시된 콘텐츠·공지·지원사업·AI TOOL 글의 제목/요약을 클라이언트에서 검색한다.
 * (데이터량이 작아 별도 검색 엔진 없이 fetch 후 필터 — lib/firestore 캐시 재사용)
 */
export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const router = useRouter();

  // 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 검색 인덱스 로드 (published 문서만)
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [contents, notices, smes, aiTools] = await Promise.all([
          getCollection<ContentDoc>(COLLECTIONS.CONTENTS).catch(() => []),
          getCollection<NoticeDoc>(COLLECTIONS.NOTICES).catch(() => []),
          getCollection<SmeSupportDoc>(COLLECTIONS.SME_SUPPORT).catch(() => []),
          getCollection<AiToolDoc>(COLLECTIONS.AI_TOOLS).catch(() => []),
        ]);
        if (!alive) return;
        const all: SearchItem[] = [
          ...contents
            .filter((d) => d.status === "published")
            .map<SearchItem>((d) => ({
              id: `c-${d.id}`,
              type: "content",
              title: d.title,
              subtitle: d.summary || d.category,
              href: `/contents/view?slug=${encodeURIComponent(d.slug)}`,
            })),
          ...notices
            .filter((d) => d.status === "published")
            .map<SearchItem>((d) => ({
              id: `n-${d.id}`,
              type: "notice",
              title: d.title,
              subtitle: htmlToPlainTextSummary(d.bodyHtml, 60),
              href: `/notice/view?id=${encodeURIComponent(d.id ?? "")}`,
            })),
          ...smes
            .filter((d) => d.status === "published")
            .map<SearchItem>((d) => ({
              id: `s-${d.id}`,
              type: "sme",
              title: d.title,
              subtitle: d.agency || d.summary,
              href: `/sme-support/view?id=${encodeURIComponent(d.id ?? "")}`,
            })),
          ...aiTools
            .filter((d) => d.status === "published")
            .map<SearchItem>((d) => ({
              id: `a-${d.id}`,
              type: "aiTool",
              title: d.title,
              subtitle: d.summary || AI_TOOL_CATEGORY_LABELS[d.category],
              href: `/ai-tools/view?slug=${encodeURIComponent(d.slug)}`,
            })),
        ];
        setItems(all);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 30);
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.subtitle ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const g: Partial<Record<SearchItem["type"], SearchItem[]>> = {};
    filtered.forEach((it) => {
      (g[it.type] ??= []).push(it);
    });
    return g;
  }, [filtered]);

  const navigate = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/40" onClick={onClose} />
      <Command
        // 모바일: 풀폭 상단 고정 / 데스크톱: 중앙 모달
        className="fixed top-0 sm:top-[15vh] left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl bg-white sm:rounded-2xl shadow-2xl overflow-hidden"
        shouldFilter={false}
        loop
      >
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="찾으시는 콘텐츠를 검색해보세요"
            className="flex-1 outline-none text-sm bg-transparent"
            autoFocus
          />
          <button
            type="button"
            onClick={onClose}
            className="px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-500 hover:bg-gray-200"
          >
            ESC
          </button>
        </div>
        <Command.List className="max-h-[70vh] sm:max-h-[55vh] overflow-y-auto p-2">
          {failed ? (
            <p className="py-10 text-center text-sm text-gray-500">
              검색을 잠시 사용할 수 없습니다. 잠시 후 다시 시도해주세요.
            </p>
          ) : items === null ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <Command.Empty className="py-10 text-center text-sm text-gray-500">
                검색 결과가 없습니다.
              </Command.Empty>
              {(Object.keys(grouped) as SearchItem["type"][]).map((type) => (
                <Command.Group
                  key={type}
                  heading={TYPE_LABEL[type]}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-400"
                >
                  {grouped[type]!.map((it) => {
                    const Icon = TYPE_ICON[it.type];
                    return (
                      <Command.Item
                        key={it.id}
                        value={it.id}
                        onSelect={() => navigate(it.href)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm data-[selected=true]:bg-blue-50"
                      >
                        <Icon className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {it.title}
                          </p>
                          {it.subtitle && (
                            <p className="text-xs text-gray-500 truncate">
                              {it.subtitle}
                            </p>
                          )}
                        </div>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
            </>
          )}
        </Command.List>
      </Command>
    </>
  );
}
