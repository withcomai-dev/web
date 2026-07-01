"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layout,
  FileText,
  Briefcase,
  ShoppingBag,
  Image as ImageIcon,
  Mail,
  Users,
  UserCheck,
  HelpCircle,
  Bug,
  Settings,
  LogOut,
  Activity,
  KeyRound,
  Megaphone,
  Bot,
  Award,
} from "lucide-react";
import { ADMIN_NAV_ITEMS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  layout: Layout,
  "file-text": FileText,
  briefcase: Briefcase,
  "shopping-bag": ShoppingBag,
  image: ImageIcon,
  mail: Mail,
  users: Users,
  "user-check": UserCheck,
  "help-circle": HelpCircle,
  bug: Bug,
  activity: Activity,
  settings: Settings,
  megaphone: Megaphone,
  key: KeyRound,
  bot: Bot,
  award: Award,
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { profile, signOutNow } = useAuth();

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-white/10 flex justify-center">
        <Link href="/" className="inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/withcomai_footer.png"
            alt="WITHCOM AI"
            className="h-[34px] w-auto"
          />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-6 py-2.5 text-sm transition-colors",
                active
                  ? "bg-blue-600/20 text-white border-l-2 border-blue-500"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className="w-4 h-4" /> {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-gray-400 mb-1">로그인</p>
        <p className="text-sm font-semibold truncate" title={profile?.email}>
          {profile?.displayName || profile?.email}
        </p>
        <p className="text-xs text-blue-400 mt-1">{profile?.role}</p>
        <button
          onClick={signOutNow}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2 rounded text-xs text-gray-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="w-3.5 h-3.5" /> 로그아웃
        </button>
      </div>
    </aside>
  );
}
