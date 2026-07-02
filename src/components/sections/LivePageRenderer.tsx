"use client";

import { useEffect, useState } from "react";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { loadPage } from "@/lib/page-loader";
import type { Section } from "@/types/cms";
import { useAuth } from "@/contexts/AuthContext";
import { canViewContent } from "@/lib/grades";
import AccessDenied from "@/components/sections/AccessDenied";

/**
 * 정적 export + 라이브 CMS 하이브리드 렌더러.
 * - 빌드 시점 콘텐츠(initialSections, 보통 시드/게시본)를 즉시 렌더 → SEO/초기표시 확보
 * - 마운트 후 브라우저에서 Firestore 의 최신 페이지를 읽어, 커스터마이즈본이 있으면 교체
 *   → 어드민이 페이지를 수정하면 재배포 없이 즉시 반영된다.
 * - 페이지 등급 게이팅(요청 20260701 권한확장): allowedGrades 미충족 시 안내 화면.
 *   등급/페이지 로딩 중에는 통과(fail-open)하여 회귀·깜빡임을 방지한다.
 */
export default function LivePageRenderer({
  pageKey,
  initialSections,
  initialAllowedGrades,
}: {
  pageKey: string;
  initialSections: Section[];
  initialAllowedGrades?: string[];
}) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [allowedGrades, setAllowedGrades] = useState<string[] | undefined>(
    initialAllowedGrades,
  );
  const { profile, isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    let alive = true;
    void loadPage(pageKey).then((p) => {
      if (alive && p) {
        if (p.sections && p.sections.length > 0) setSections(p.sections);
        setAllowedGrades(p.allowedGrades);
      }
    });
    return () => {
      alive = false;
    };
  }, [pageKey]);

  // 등급 게이팅 (fail-open: 인증 로딩 중엔 통과)
  if (!authLoading && !canViewContent(allowedGrades, profile?.grade, isAdmin, !!profile)) {
    return <AccessDenied />;
  }

  if (!sections || sections.length === 0) {
    return <div className="py-20 text-center">페이지를 찾을 수 없습니다.</div>;
  }
  return <SectionRenderer sections={sections} />;
}
