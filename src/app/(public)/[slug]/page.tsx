import { COLLECTIONS, getSingletonDoc } from "@/lib/firestore";
import type { PageRegistry } from "@/types/cms";
import CustomPageClient from "./CustomPageClient";

const REGISTRY_DOC_ID = "pageRegistry";

const HARD_RESERVED = new Set([
  "about",
  "smartwork-ai",
  "it-service",
  "sme-support",
  "contact",
  "contents",
  "shop",
  "youtube",
  "help",
  "login",
  "admin",
  "preview",
  "api",
]);

// 빌드 시점에 존재하는 커스텀 페이지 slug 를 정적 생성한다.
// "__none__" 은 항상 포함 — Firebase Hosting 의 catch-all rewrite 대상(범용 렌더러)이며,
// 빌드 환경이 Firestore 에 접근 못 해도(빈 배열 불가) 안전망 역할을 한다.
// 빌드에 없던 새 커스텀 페이지도 rewrite 로 __none__ 가 서빙되어 런타임에 렌더된다.
export async function generateStaticParams() {
  const params: { slug: string }[] = [{ slug: "__none__" }];
  try {
    const reg = await getSingletonDoc<PageRegistry>(
      COLLECTIONS.SETTINGS,
      REGISTRY_DOC_ID,
    );
    if (reg && Array.isArray(reg.pages)) {
      for (const p of reg.pages) {
        const s = (p.slug ?? "").replace(/^\//, "");
        if (s.length > 0 && !HARD_RESERVED.has(s)) params.push({ slug: s });
      }
    }
  } catch {
    /* 빌드 시 Firestore 미연결 → __none__ 만으로 진행 */
  }
  return params;
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CustomPageClient slug={slug} />;
}
