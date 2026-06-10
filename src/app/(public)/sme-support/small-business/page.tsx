import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";

export const metadata = { title: "소상공인 지원사업" };

// 소상공인 지원사업 전용 페이지 — 어드민 [페이지·섹션] > 소상공인 지원사업 에서 수정
export default async function SmeSmallBusinessPage() {
  const page = await loadPage("sme-small-business");
  return (
    <LivePageRenderer
      pageKey="sme-small-business"
      initialSections={page?.sections ?? []}
    />
  );
}
