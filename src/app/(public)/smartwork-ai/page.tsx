import { loadPage } from "@/lib/page-loader";
import SectionRenderer from "@/components/sections/SectionRenderer";

export default async function SmartworkAIPage() {
  const page = await loadPage("smartwork-ai");
  if (!page) return <div className="py-20 text-center">페이지를 찾을 수 없습니다.</div>;
  return <SectionRenderer sections={page.sections} />;
}
