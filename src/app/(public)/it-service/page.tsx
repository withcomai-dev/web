import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";

export default async function ITServicePage() {
  const page = await loadPage("it-service");
  return <LivePageRenderer pageKey="it-service" initialSections={page?.sections ?? []} />;
}
