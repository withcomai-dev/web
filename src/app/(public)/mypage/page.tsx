"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  LogOut,
  LogIn,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getRunmoaUser, isRunmoaLoggedIn } from "@/lib/runmoa-session";
import { startRunmoa } from "@/lib/runmoa-auth";
import { fullLogout } from "@/lib/logout";
import type { RunmoaUser } from "@/lib/runmoa-oauth";

export default function MyPage() {
  const { isAdmin } = useAuth();
  // 로그인 상태(null=확인 전)와 런모아 사용자 정보는 클라이언트에서만 읽는다
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<RunmoaUser | null>(null);

  useEffect(() => {
    setLoggedIn(isRunmoaLoggedIn());
    setUser(getRunmoaUser());
  }, []);

  // 확인 전: 빈 영역(깜빡임 방지)
  if (loggedIn === null) {
    return <div className="min-h-[60vh]" aria-hidden />;
  }

  // 비로그인: 로그인 유도
  if (!loggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <LogIn className="h-7 w-7 text-blue-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">로그인이 필요합니다</h1>
        <p className="mb-8 text-gray-500">
          마이페이지는 로그인 후 이용할 수 있습니다.
        </p>
        <button
          type="button"
          onClick={() => startRunmoa("login")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700"
        >
          <LogIn className="h-4 w-4" /> 간편 로그인
        </button>
      </div>
    );
  }

  const name = user?.user_name?.trim() || "회원";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900">
        마이페이지
      </h1>

      {/* 프로필 카드 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
            {initial}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{name}님</p>
            {isAdmin && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                <ShieldCheck className="h-3.5 w-3.5" /> 관리자
              </span>
            )}
          </div>
        </div>

        {/* 회원 정보 */}
        <dl className="mt-8 space-y-4 border-t border-gray-100 pt-6">
          <InfoRow icon={<User className="h-4 w-4" />} label="이름" value={user?.user_name} />
          <InfoRow icon={<Mail className="h-4 w-4" />} label="이메일" value={user?.user_email} />
          <InfoRow icon={<Phone className="h-4 w-4" />} label="연락처" value={user?.user_phone} />
        </dl>
      </div>

      {/* 관리자 바로가기 */}
      {isAdmin && (
        <Link
          href="/admin"
          className="mt-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/50"
        >
          <span className="flex items-center gap-3 font-semibold text-gray-900">
            <ShieldCheck className="h-5 w-5 text-blue-600" /> 관리자 콘솔
          </span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </Link>
      )}

      {/* 로그아웃 */}
      <button
        type="button"
        onClick={() => void fullLogout()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-4 font-semibold text-gray-700 shadow-sm transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
      >
        <LogOut className="h-5 w-5" /> 로그아웃
      </button>
    </div>
  );
}

/** 회원 정보 한 줄 */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-gray-400">{label}</dt>
        <dd className="truncate text-sm font-medium text-gray-800">
          {value?.trim() || "—"}
        </dd>
      </div>
    </div>
  );
}
