"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { startRunmoa } from "@/lib/runmoa-auth";

/** 등급 미달 접근 시 안내 화면 (요청 20260701 권한확장 — 차단=안내) */
export default function AccessDenied() {
  const { profile } = useAuth();
  const loggedIn = !!profile;
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-4 py-24 bg-slate-50">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          회원 등급 전용 콘텐츠입니다
        </h1>
        <p className="text-gray-500 mb-8">
          {loggedIn
            ? "현재 회원 등급으로는 이 페이지를 볼 수 없습니다. 열람 권한이 필요하면 문의해 주세요."
            : "로그인하시면 회원 등급에 따라 열람할 수 있습니다."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!loggedIn && (
            <button
              type="button"
              onClick={() => startRunmoa("login")}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              로그인
            </button>
          )}
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
          >
            홈으로
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
          >
            문의하기
          </Link>
        </div>
      </div>
    </section>
  );
}
