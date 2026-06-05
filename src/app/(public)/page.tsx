import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";

export default async function HomePage() {
  const page = await loadPage("home");
  return <LivePageRenderer pageKey="home" initialSections={page?.sections ?? []} />;
}
