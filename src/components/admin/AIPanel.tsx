"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, Loader2, Send, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "free" | "polish" | "summarize" | "expand" | "seo" | "draft-reply";

interface Recipe {
  id: Mode | "page-gen";
  label: string;
  hint: string;
}

const RECIPES_BY_PATH: Array<{ match: RegExp | string; recipes: Recipe[] }> = [
  {
    match: /^\/admin\/pages/,
    recipes: [
      { id: "page-gen", label: "AI로 새 페이지 생성", hint: "프롬프트 입력 → 섹션 자동 생성" },
    ],
  },
  {
    match: /^\/admin\/contents/,
    recipes: [
      { id: "polish", label: "✨ 본문 다듬기", hint: "어색한 표현·맞춤법·가독성 개선" },
      { id: "summarize", label: "📝 요약 생성", hint: "본문을 1/3 길이로" },
      { id: "expand", label: "➕ 본문 확장", hint: "예시·디테일 추가" },
      { id: "seo", label: "🔍 SEO 메타 생성", hint: "제목·설명·키워드 추천" },
    ],
  },
  {
    match: /^\/admin\/help/,
    recipes: [
      { id: "draft-reply", label: "💬 답변 초안", hint: "받은 질문에 대한 답변 작성" },
      { id: "polish", label: "✨ 본문 다듬기", hint: "" },
    ],
  },
  {
    match: /^\/admin\/inquiries/,
    recipes: [{ id: "draft-reply", label: "💬 답변 초안", hint: "정중한 답변 작성" }],
  },
  {
    match: /^\/admin/,
    recipes: [
      { id: "polish", label: "✨ 텍스트 다듬기", hint: "" },
      { id: "summarize", label: "📝 요약", hint: "" },
    ],
  },
];

function recipesFor(pathname: string): Recipe[] {
  for (const { match, recipes } of RECIPES_BY_PATH) {
    if (typeof match === "string" ? pathname.startsWith(match) : match.test(pathname)) {
      return recipes;
    }
  }
  return [];
}

export default function AIPanel() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode | "page-gen">("free");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const recipes = useMemo(() => recipesFor(pathname), [pathname]);

  useEffect(() => {
    setOutput("");
    setErr(null);
  }, [mode]);

  // Cmd/Ctrl + I 단축키로 토글
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setErr(null);
    setOutput("");
    try {
      let url = "";
      let body: unknown = {};
      if (mode === "polish" || mode === "summarize" || mode === "expand") {
        url = "/api/ai/refine-text";
        body = { text: input, mode };
      } else if (mode === "seo") {
        url = "/api/ai/seo";
        body = { title: "", bodyHtml: input };
      } else if (mode === "draft-reply") {
        url = "/api/ai/draft-reply";
        body = { question: input, tone: "formal" };
      } else if (mode === "page-gen") {
        url = "/api/ai/page-generate";
        body = { prompt: input, tone: "professional", pageKey: "ai", pageTitle: "AI 생성 페이지" };
      } else {
        // free mode → 다듬기로 폴백
        url = "/api/ai/refine-text";
        body = { text: input, mode: "polish" };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `요청 실패 (${res.status})`);
      }
      const data = await res.json();
      const text =
        data.result ??
        (data.title && data.description
          ? `[제목]\n${data.title}\n\n[설명]\n${data.description}\n\n[키워드]\n${(data.keywords ?? []).join(", ")}`
          : data.sections
            ? `[생성된 섹션 ${data.sections.length}개]\n` +
              data.sections
                .map(
                  (s: { type: string; data: { title?: string } }) =>
                    `- ${s.type}: ${s.data?.title ?? ""}`,
                )
                .join("\n")
            : JSON.stringify(data, null, 2));
      setOutput(text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI 호출 실패");
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <button
        type="button"
        title="AI 도우미 (Cmd+I)"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed top-24 right-24 z-40 w-12 h-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30 flex items-center justify-center",
          open && "opacity-0 pointer-events-none",
        )}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed top-0 right-0 z-50 h-full w-full sm:w-[460px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-violet-600 text-white">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-5 h-5" />
                <span>AI 도우미 (Gemini 2.5 Flash)</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <p className="text-xs text-gray-500 mb-2">현재 페이지 추천 명령</p>
              <div className="flex flex-wrap gap-1.5">
                {recipes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setMode(r.id as Mode | "page-gen")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border",
                      mode === r.id
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-violet-400",
                    )}
                    title={r.hint}
                  >
                    {r.label}
                  </button>
                ))}
                <button
                  onClick={() => setMode("free")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border",
                    mode === "free"
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-gray-600 border-gray-200",
                  )}
                >
                  자유 입력
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={6}
                placeholder={
                  mode === "page-gen"
                    ? "예) 중소기업 AI 도구 도입 가이드 페이지. Hero + 4개 도구 카드 + 도입 효과 + 상담 신청 CTA."
                    : mode === "draft-reply"
                      ? "고객 질문/문의 내용을 붙여넣으세요."
                      : mode === "seo"
                        ? "본문(HTML)을 붙여넣으세요. 제목과 설명·키워드를 생성합니다."
                        : "다듬을·요약할·확장할 텍스트를 입력하세요."
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:border-violet-500 outline-none"
              />
              <button
                onClick={submit}
                disabled={loading || !input.trim()}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? "Gemini 호출 중..." : "실행"}
              </button>

              {err && <p className="text-sm text-rose-600">{err}</p>}

              {output && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500">결과</p>
                    <button
                      onClick={copyOutput}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-gray-100"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "복사됨" : "복사"}
                    </button>
                  </div>
                  <pre className="text-sm whitespace-pre-wrap font-sans bg-gray-50 p-3 rounded-lg max-h-[40vh] overflow-y-auto">
                    {output}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 text-xs text-gray-400 text-center">
              Cmd+I 단축키로 빠른 호출
            </div>
          </aside>
        </>
      )}
    </>
  );
}
