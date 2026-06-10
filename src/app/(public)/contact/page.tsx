import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";

export const metadata = { title: "문의하기" };

// 고객서비스(문의) 페이지 — 다른 코어 페이지와 동일하게 CMS(페이지·섹션) 구동.
// 배너·문의 폼 구성은 어드민 [페이지·섹션] > contact 에서 수정한다.
export default async function ContactPage() {
  const page = await loadPage("contact");
  return (
    <LivePageRenderer pageKey="contact" initialSections={page?.sections ?? []} />
  );
}
