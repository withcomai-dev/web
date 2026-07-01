import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";

export const metadata = { title: "진행중인 지원사업 소개" };

// 진행중인 지원사업 소개 전용 페이지 — 어드민 [페이지·섹션] > 진행중인 지원사업 소개 에서 수정
export default async function SmeOngoingPage() {
  const page = await loadPage("sme-ongoing");
  return (
    <LivePageRenderer
      pageKey="sme-ongoing"
      initialSections={page?.sections ?? []}
    />
  );
}
