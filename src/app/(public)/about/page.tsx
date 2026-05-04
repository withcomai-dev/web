import { loadPage } from "@/lib/page-loader";
import SectionRenderer from "@/components/sections/SectionRenderer";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const page = await loadPage("about");
  if (!page) return <div className="py-20 text-center">페이지를 찾을 수 없습니다.</div>;
  return <SectionRenderer sections={page.sections} />;
}
