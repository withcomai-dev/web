"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isRunmoaLoggedIn } from "@/lib/runmoa-session";

/**
 * 푸터 로그인/마이페이지 링크 — 로그인 상태에 따라 전환한다.
 * 로그인 여부는 클라이언트(localStorage)에서만 확인 가능하므로 클라이언트 컴포넌트로 분리.
 */
export default function FooterAuthLink() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isRunmoaLoggedIn());
  }, []);

  return loggedIn ? (
    <Link href="/mypage" className="hover:text-gray-300">
      마이페이지
    </Link>
  ) : (
    <Link href="/login" className="hover:text-gray-300">
      로그인
    </Link>
  );
}
