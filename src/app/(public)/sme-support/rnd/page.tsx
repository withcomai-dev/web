import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";

export const metadata = { title: "R&D 지원사업" };

// R&D 지원사업 전용 페이지 — 어드민 [페이지·섹션] > R&D 지원사업 에서 수정
export default async function SmeRndPage() {
  const page = await loadPage("sme-rnd");
  return (
    <LivePageRenderer pageKey="sme-rnd" initialSections={page?.sections ?? []} />
  );
}
