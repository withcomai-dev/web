import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";

export default async function AboutPage() {
  const page = await loadPage("about");
  return <LivePageRenderer pageKey="about" initialSections={page?.sections ?? []} />;
}
