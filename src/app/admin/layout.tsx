import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AIPanel from "@/components/admin/AIPanel";
import GlobalSearch from "@/components/admin/GlobalSearch";
import NotificationBell from "@/components/admin/NotificationBell";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import HelpWidget from "@/components/help/HelpWidget";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 p-8 overflow-x-auto">{children}</main>
      </div>
      <NotificationBell />
      <AIPanel />
      <GlobalSearch />
      <FeedbackButton />
      <HelpWidget />
    </AdminGuard>
  );
}
