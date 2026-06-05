import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";

export default async function SmartworkAIPage() {
  const page = await loadPage("smartwork-ai");
  return <LivePageRenderer pageKey="smartwork-ai" initialSections={page?.sections ?? []} />;
}
