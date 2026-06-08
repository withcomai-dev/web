"use client";

/**
 * 런모아 로그인 완료 처리 페이지 (클라이언트).
 *
 * 서버 라우트(/auth/callback)가 code→token 교환과 사용자 조회를 마친 뒤,
 * 결과를 URL 프래그먼트(#token=...&user=...)에 담아 이 페이지로 리다이렉트한다.
 * 여기서는 그 결과를 localStorage 세션으로 저장하고 원래 위치로 이동만 한다.
 * (시크릿은 서버에서만 다뤘으므로 이 코드에는 시크릿이 없다.)
 */

import { Suspense, useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { consumeRunmoaNext } from "@/lib/runmoa-auth";
import { setRunmoaSession } from "@/lib/runmoa-session";
import type { RunmoaUser } from "@/lib/runmoa-oauth";

type Phase =
  | { kind: "loading" }
  | { kind: "success"; next: string }
  | { kind: "error"; message: string };

/** URL 의 프래그먼트(#...)에서 결과 파라미터를 읽는다. */
function readFragment(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
}

function handleResult(): Phase {
  const f = readFragment();

  const error = f.get("error");
  if (error) return { kind: "error", message: error };

  const token = f.get("token");
  const userRaw = f.get("user");
  if (token && userRaw) {
    try {
      const user = JSON.parse(userRaw) as RunmoaUser;
      setRunmoaSession(token, user);
      return { kind: "success", next: consumeRunmoaNext() };
    } catch {
      return { kind: "error", message: "사용자 정보 해석에 실패했습니다" };
    }
  }

  return { kind: "error", message: "로그인 결과를 받지 못했습니다" };
}

function DoneInner() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });

  useEffect(() => {
    const result = handleResult();
    // 토큰이 주소창(프래그먼트)에 남지 않도록 즉시 제거
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      // ignore
    }
    setPhase(result);
    if (result.kind === "success") {
      const t = setTimeout(() => window.location.replace(result.next), 600);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center">
        {phase.kind === "loading" && (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">런모아 로그인 처리 중…</p>
          </>
        )}

        {phase.kind === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <p className="text-gray-800 font-semibold mb-1">로그인되었습니다</p>
            <p className="text-gray-500 text-sm">잠시 후 이동합니다…</p>
          </>
        )}

        {phase.kind === "error" && (
          <>
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="text-gray-800 font-semibold mb-1">로그인에 실패했습니다</p>
            <p className="text-gray-500 text-sm break-all mb-6">{phase.message}</p>
            <a
              href="/"
              className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              홈으로
            </a>
          </>
        )}
      </div>
    </main>
  );
}

export default function RunmoaDonePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </main>
      }
    >
      <DoneInner />
    </Suspense>
  );
}
