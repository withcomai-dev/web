import LivePageRenderer from "@/components/sections/LivePageRenderer";
import { loadPage } from "@/lib/page-loader";
import SmeSupportList from "./SmeSupportList";

export default async function SmeSupportPage() {
  const page = await loadPage("sme-support");
  return (
    <>
      <LivePageRenderer pageKey="sme-support" initialSections={page?.sections ?? []} />
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <SmeSupportList />
        </div>
      </section>
    </>
  );
}
