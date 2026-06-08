import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";
import SmeSupportList from "./sme-support/SmeSupportList";

export default async function HomePage() {
  const page = await loadPage("home");
  return (
    <>
      <LivePageRenderer pageKey="home" initialSections={page?.sections ?? []} />
      <SmeSupportList
        sectionClassName="py-20 bg-white"
        limitPerCategory={3}
        showViewAll
        hideWhenEmpty
        eyebrow="SME Support"
        heading="중소기업 지원사업"
        description="소상공인·R&D 지원사업 정보를 한눈에 확인하세요."
      />
    </>
  );
}
