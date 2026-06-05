"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, X, Search, Send, Loader2, Check } from "lucide-react";
import {
  COLLECTIONS,
  createDoc,
  getOrderedCollection,
} from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import type { HelpDoc } from "@/types/cms";
import { cn } from "@/lib/utils";

type Phase = "idle" | "submitting" | "done" | "error";

const PATH_TO_CATEGORY: Record<string, string> = {
  "/contact": "문의·상담",
  "/shop": "쇼핑몰",
  "/login": "회원·로그인",
  "/admin": "사이트 이용",
};

function inferCategory(pathname: string): string | null {
  for (const [prefix, category] of Object.entries(PATH_TO_CATEGORY)) {
    if (pathname.startsWith(prefix)) return category;
  }
  return null;
}

export default function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"docs" | "ask">("docs");
  const [docs, setDocs] = useState<HelpDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!open || docs.length > 0) return;
    setLoading(true);
    getOrderedCollection<HelpDoc>(COLLECTIONS.HELP_DOCS, "order", "asc")
      .then((d) =>
        setDocs(
          d.filter(
            (doc) =>
              doc.status === "published" &&
              (doc.audience === "public" ||
                doc.audience === "both" ||
                (isAdmin && doc.audience === "admin")),
          ),
        ),
      )
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [open, docs.length, isAdmin]);

  const ctxCategory = useMemo(() => inferCategory(pathname), [pathname]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = docs;
    if (q) {
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.bodyHtml.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q),
      );
    }
    if (ctxCategory && !q) {
      const ctxDocs = list.filter((d) => d.category === ctxCategory);
      const others = list.filter((d) => d.category !== ctxCategory);
      list = [...ctxDocs, ...others];
    }
    return list;
  }, [docs, search, ctxCategory]);

  const submitQuestion = async () => {
    if (!question.trim() || phase === "submitting") return;
    setPhase("submitting");
    setErrMsg(null);
    try {
      await createDoc(COLLECTIONS.HELP_QUESTIONS, {
        question: question.trim(),
        askerUid: user?.uid,
        askerEmail: user?.email ?? undefined,
        pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        status: "open",
      });
      setPhase("done");
      setQuestion("");
      setTimeout(() => setPhase("idle"), 2000);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "전송 실패");
      setPhase("error");
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="도움말 열기"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed top-24 right-6 z-40",
          "w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30",
          "flex items-center justify-center transition-opacity",
          open && "opacity-0 pointer-events-none",
        )}
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-blue-600 text-white">
              <div className="flex items-center gap-2 font-semibold">
                <HelpCircle className="w-5 h-5" />
                <span>도움말</span>
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setTab("docs")}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold border-b-2 transition-colors",
                  tab === "docs"
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-500 border-transparent hover:text-gray-700",
                )}
              >
                도움말 보기
              </button>
              <button
                onClick={() => setTab("ask")}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold border-b-2 transition-colors",
                  tab === "ask"
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-500 border-transparent hover:text-gray-700",
                )}
              >
                직접 질문하기
              </button>
            </div>

            {tab === "docs" ? (
              <>
                <div className="p-4 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="키워드로 검색"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                  {ctxCategory && !search && (
                    <p className="mt-2 text-xs text-blue-600">
                      현재 페이지 관련: <strong>{ctxCategory}</strong>
                    </p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-10">
                      도움말이 없습니다.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {filtered.map((doc) => (
                        <li key={doc.id}>
                          <Link
                            href={`/help/view?slug=${encodeURIComponent(doc.slug)}`}
                            onClick={() => setOpen(false)}
                            className="block p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <p className="text-xs text-blue-600 font-semibold mb-1">
                              {doc.category}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {doc.title}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100">
                  <Link
                    href="/help"
                    onClick={() => setOpen(false)}
                    className="block w-full py-2 rounded-lg text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    전체 도움말 보기 →
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col p-4">
                {phase === "done" ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                      <Check className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="font-semibold text-gray-900">질문이 전송되었습니다.</p>
                    <p className="mt-1 text-sm text-gray-500">
                      관리자가 확인 후 답변드립니다.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-3">
                      도움말에 없는 내용은 직접 질문해주세요. 관리자가 답변 후 도움말로
                      등록하기도 합니다.
                    </p>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      rows={6}
                      maxLength={4900}
                      placeholder="궁금한 점을 적어주세요."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500 text-sm resize-none"
                    />
                    {errMsg && <p className="mt-2 text-sm text-red-600">{errMsg}</p>}
                    <button
                      type="button"
                      disabled={phase === "submitting" || !question.trim()}
                      onClick={submitQuestion}
                      className="mt-4 inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold"
                    >
                      {phase === "submitting" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      질문 보내기
                    </button>
                  </>
                )}
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
