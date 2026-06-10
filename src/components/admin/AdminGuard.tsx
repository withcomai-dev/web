"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Lock, ShieldX, LogIn, Home } from "lucide-react";
import { startRunmoa } from "@/lib/runmoa-auth";

/**
 * 어드민 접근 가드.
 * - 비로그인: "로그인 필요" 안내를 잠깐 보여주고 곧바로 런모아 로그인으로 이동
 *   (로그인 완료 시 원래 어드민 경로로 자동 복귀 — startRunmoa 가 현재 경로를 저장)
 * - 로그인 + 관리자 권한: 통과
 * - 로그인 + 권한 없음: "접근 권한이 없습니다" 모달 → 홈으로
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { loading, user, isAdmin } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  // 비로그인: 안내 1.2초 후 런모아 로그인으로 자동 이동
  useEffect(() => {
    if (loading || user || redirected.current) return;
    redirected.current = true;
    const t = setTimeout(() => startRunmoa("login"), 1200);
    return () => clearTimeout(t);
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // 1) 비로그인 — 로그인 필요 안내 (곧바로 로그인 페이지로 이동)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="mb-2 text-lg font-bold text-gray-900">
            로그인이 필요합니다
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-gray-500">
            관리자 페이지는 로그인 후 이용할 수 있습니다.
            <br />
            잠시 후 로그인 페이지로 이동합니다…
          </p>
          <button
            type="button"
            onClick={() => startRunmoa("login")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700"
          >
            <LogIn className="h-4 w-4" /> 지금 로그인
          </button>
        </div>
      </div>
    );
  }

  // 2) 로그인했지만 관리자 권한 없음 — 차단 모달
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
        <div
          className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
            <ShieldX className="h-6 w-6 text-rose-600" />
          </div>
          <h1 className="mb-2 text-lg font-bold text-gray-900">
            접근 권한이 없습니다
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-gray-500">
            관리자 페이지는 <b>관리자 권한이 있는 계정</b>만 이용할 수 있습니다.
            <br />
            권한이 필요하시면 운영자에게 문의해 주세요.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700"
          >
            <Home className="h-4 w-4" /> 홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
