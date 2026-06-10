import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
// 우측 상단 AI 도우미 임시 숨김 — 컴포넌트는 유지, 렌더만 제외(추후 복원 가능)
// import AIPanel from "@/components/admin/AIPanel";
import GlobalSearch from "@/components/admin/GlobalSearch";
import NotificationBell from "@/components/admin/NotificationBell";
// 우측 플로팅 위젯(신고하기·도움말) 임시 숨김 — 컴포넌트는 유지, 렌더만 제외(추후 복원 가능)
// import FeedbackButton from "@/components/feedback/FeedbackButton";
// import HelpWidget from "@/components/help/HelpWidget";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 p-8 overflow-x-auto">{children}</main>
      </div>
      <NotificationBell />
      {/* <AIPanel /> */}
      <GlobalSearch />
      {/* <FeedbackButton /> */}
      {/* <HelpWidget /> */}
    </AdminGuard>
  );
}
