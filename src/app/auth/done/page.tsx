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
import { Loader2, AlertTriangle } from "lucide-react";
import { signInWithCustomToken } from "firebase/auth";
import { consumeRunmoaNext } from "@/lib/runmoa-auth";
import { setRunmoaSession } from "@/lib/runmoa-session";
import { auth } from "@/lib/firebase";
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

function DoneInner() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });

  useEffect(() => {
    const f = readFragment();
    const error = f.get("error");
    const token = f.get("token");
    const userRaw = f.get("user");
    const fbToken = f.get("fbToken");
    // 토큰이 주소창(프래그먼트)에 남지 않도록 즉시 제거
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      // ignore
    }

    let cancelled = false;
    void (async () => {
      if (error) {
        if (!cancelled) setPhase({ kind: "error", message: error });
        return;
      }
      if (!token || !userRaw) {
        if (!cancelled)
          setPhase({ kind: "error", message: "로그인 결과를 받지 못했습니다" });
        return;
      }
      let user: RunmoaUser;
      try {
        user = JSON.parse(userRaw) as RunmoaUser;
      } catch {
        if (!cancelled)
          setPhase({ kind: "error", message: "사용자 정보 해석에 실패했습니다" });
        return;
      }

      setRunmoaSession(token, user);
      // 어드민 권한용 Firebase 세션 수립(커스텀 토큰이 있을 때만). 실패해도 일반 로그인은 성공.
      if (fbToken) {
        try {
          await signInWithCustomToken(auth, fbToken);
        } catch (e) {
          console.error("Firebase 세션 수립 실패:", e);
        }
      }

      const next = consumeRunmoaNext();
      if (cancelled) return;
      // 성공 시 흰 카드("로그인되었습니다")를 띄우지 않고 즉시 원래 위치로 이동(매끄러운 경험).
      window.location.replace(next);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 흰 카드(모달처럼 보이던 것) 제거 — 로그인 처리 중엔 옅은 스피너만, 실패 시에만 간단 안내.
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      {phase.kind === "error" ? (
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 text-sm break-all mb-4">{phase.message}</p>
          <a href="/" className="text-blue-600 text-sm underline">
            홈으로
          </a>
        </div>
      ) : (
        <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
      )}
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
