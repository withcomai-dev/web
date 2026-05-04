"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [user, loading, next, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-2">위드컴정보</h1>
        <p className="text-gray-500 mb-10">Google 계정으로 로그인하세요.</p>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <button
            onClick={signIn}
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            <LogIn className="w-5 h-5" /> Google로 로그인
          </button>
        )}

        <p className="mt-8 text-xs text-gray-400">
          로그인하시면 위드컴정보의 이용약관과 개인정보처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </main>
  );
}
