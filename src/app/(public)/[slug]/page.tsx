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
// (이후 새로 만든 페이지는 재배포 시 반영)
export async function generateStaticParams() {
  try {
    const reg = await getSingletonDoc<PageRegistry>(
      COLLECTIONS.SETTINGS,
      REGISTRY_DOC_ID,
    );
    if (reg && Array.isArray(reg.pages)) {
      const params = reg.pages
        .map((p) => (p.slug ?? "").replace(/^\//, ""))
        .filter((s) => s.length > 0 && !HARD_RESERVED.has(s))
        .map((slug) => ({ slug }));
      if (params.length > 0) return params;
    }
  } catch {
    /* 빌드 시 Firestore 미연결 → sentinel 폴백 */
  }
  // output:export 는 빈 배열을 허용하지 않으므로 sentinel 1개 (클라이언트가 not-found 렌더)
  return [{ slug: "__none__" }];
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CustomPageClient slug={slug} />;
}
