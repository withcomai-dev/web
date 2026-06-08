"use client";

/**
 * 런모아 로그인/회원가입 콜백 수신 페이지.
 *
 * 런모아가 로그인 완료 후 redirect_uri 로 지정된 이 주소로 사용자를 되돌려보낸다.
 * 정적 사이트(서버 없음)이므로 반환 파라미터를 클라이언트에서 직접 해석한다.
 *
 * ── 런모아 반환 형식이 확정되면 handleParams() 한 곳만 수정하면 된다. ──
 * 현재는 흔한 형식(token / access_token / code 등)을 자동 인식하고,
 * 인식 못 하면 받은 파라미터를 그대로 화면에 표시해 사양을 파악할 수 있게 한다.
 */

import { Suspense, useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { consumeRunmoaNext } from "@/lib/runmoa-auth";
import { RUNMOA_TOKEN_KEY } from "@/lib/runmoa-session";

type Phase =
  | { kind: "loading" }
  | { kind: "success"; next: string }
  | { kind: "unknown"; params: Record<string, string> }
  | { kind: "error"; message: string };

/** URL 의 query(?...)와 hash(#...) 양쪽에서 파라미터를 모은다. */
function collectParams(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof window === "undefined") return out;
  const q = new URLSearchParams(window.location.search);
  q.forEach((v, k) => (out[k] = v));
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (hash) {
    const h = new URLSearchParams(hash);
    h.forEach((v, k) => (out[k] = v));
  }
  return out;
}

const TOKEN_KEYS = ["token", "access_token", "accessToken", "id_token", "jwt"];
const ERROR_KEYS = ["error", "error_description", "message"];

function handleParams(params: Record<string, string>): Phase {
  // 1) 에러 반환 처리
  for (const k of ERROR_KEYS) {
    if (params[k]) {
      return { kind: "error", message: params[k] };
    }
  }

  // 2) 토큰이 직접 넘어오는 형식 (정적 사이트에서 바로 세션화 가능)
  for (const k of TOKEN_KEYS) {
    if (params[k]) {
      try {
        localStorage.setItem(RUNMOA_TOKEN_KEY, params[k]);
      } catch {
        // 저장 실패해도 흐름은 계속
      }
      return { kind: "success", next: consumeRunmoaNext() };
    }
  }

  // 3) authorization code 만 넘어오는 형식 → 토큰 교환은 서버(secret)가 필요.
  //    정적 사이트라 여기서 교환할 수 없으므로, code 를 보관하고 사양 확정 후 처리.
  if (params.code) {
    try {
      localStorage.setItem("runmoa.auth.code", params.code);
    } catch {
      // ignore
    }
    return { kind: "unknown", params };
  }

  // 4) 인식 불가 → 받은 파라미터를 노출해 사양 파악
  return { kind: "unknown", params };
}

function CallbackInner() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });

  useEffect(() => {
    const params = collectParams();
    const result = handleParams(params);
    setPhase(result);
    if (result.kind === "success") {
      const t = setTimeout(() => {
        window.location.replace(result.next);
      }, 600);
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

        {phase.kind === "unknown" && (
          <>
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-800 font-semibold mb-2">
              런모아 응답을 받았습니다
            </p>
            <p className="text-gray-500 text-sm mb-4">
              세션 처리를 위해 아래 반환값 형식 확인이 필요합니다.
            </p>
            <pre className="text-left text-xs bg-slate-100 rounded-lg p-3 overflow-auto max-h-48 mb-6">
              {Object.keys(phase.params).length
                ? JSON.stringify(phase.params, null, 2)
                : "(반환 파라미터 없음)"}
            </pre>
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

export default function RunmoaCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
