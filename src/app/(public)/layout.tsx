import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import HelpWidget from "@/components/help/HelpWidget";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="pt-20">{children}</main>
      <Footer />
      <FeedbackButton />
      <HelpWidget />
    </>
  );
}
