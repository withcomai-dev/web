"use client";

import { useEffect, useState } from "react";
import { Bug, X, Send, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { installFeedbackHooks, submitFeedback } from "@/lib/feedback-engine";

type Phase = "idle" | "submitting" | "done" | "error";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    installFeedbackHooks();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setMessage("");
      setPhase("idle");
      setErrorMsg(null);
    }, 200);
  };

  const submit = async () => {
    if (!message.trim() || phase === "submitting") return;
    setPhase("submitting");
    setErrorMsg(null);
    try {
      await submitFeedback(message);
      setPhase("done");
      setTimeout(close, 1500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "전송 실패");
      setPhase("error");
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="버그 신고·의견 보내기"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 group",
          "flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30",
          "transition-all duration-200",
          open && "opacity-0 pointer-events-none",
        )}
      >
        <Bug className="w-5 h-5" />
        <span className="hidden sm:inline-block max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[120px]">
          버그 신고
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-rose-600 text-white">
              <div className="flex items-center gap-2 font-semibold">
                <Bug className="w-5 h-5" />
                <span>버그·의견 신고</span>
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={close}
                className="p-1 rounded hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {phase === "done" ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-gray-900">신고가 전송되었습니다.</p>
                  <p className="mt-1 text-sm text-gray-500">관리자가 확인 후 조치합니다.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                    무엇이 잘못되었나요? 화면 캡처와 기술 정보가 자동으로 첨부됩니다.
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="예) 쇼핑몰에서 결제 버튼을 눌러도 반응이 없어요."
                    rows={5}
                    maxLength={4900}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-sm resize-none"
                  />
                  {errorMsg && (
                    <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
                  )}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={close}
                      className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={phase === "submitting" || !message.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold"
                    >
                      {phase === "submitting" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      전송
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
