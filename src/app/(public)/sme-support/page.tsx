import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";

// 중소기업 지원사업 허브 — 카테고리 진입 카드 2개(소상공인·R&D)는 CMS 섹션으로 구성.
// 개별 사업 리스트는 카테고리 페이지(/sme-support/small-business·rnd)에서 노출한다.
export default async function SmeSupportPage() {
  const page = await loadPage("sme-support");
  return (
    <LivePageRenderer
      pageKey="sme-support"
      initialSections={page?.sections ?? []}
    />
  );
}
