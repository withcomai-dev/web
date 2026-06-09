import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
// 우측 플로팅 위젯(신고하기·도움말) 임시 숨김 — 컴포넌트는 유지, 렌더만 제외(추후 복원 가능)
// import FeedbackButton from "@/components/feedback/FeedbackButton";
// import HelpWidget from "@/components/help/HelpWidget";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="pt-20">{children}</main>
      <Footer />
      {/* <FeedbackButton /> */}
      {/* <HelpWidget /> */}
    </>
  );
}
