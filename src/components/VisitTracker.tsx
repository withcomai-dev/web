"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageview } from "@/lib/track";

/** 공개 레이아웃에 마운트 — 라우트 변경마다 방문(페이지뷰) 집계. UI 없음. */
export default function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) trackPageview(pathname);
  }, [pathname]);
  return null;
}
