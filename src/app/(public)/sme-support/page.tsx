import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";
import SmeSupportList from "./SmeSupportList";

export default async function SmeSupportPage() {
  const page = await loadPage("sme-support");
  return (
    <>
      <LivePageRenderer pageKey="sme-support" initialSections={page?.sections ?? []} />
      <SmeSupportList />
    </>
  );
}
