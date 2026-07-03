"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  User,
  Search,
  Home,
  BrainCircuit,
  Monitor,
  Building2,
  Headset,
  type LucideIcon,
} from "lucide-react";
import SearchOverlay from "@/components/layout/SearchOverlay";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import {
  COLLECTIONS,
  GLOBAL_SETTINGS_DOC_ID,
  getSingletonDoc,
} from "@/lib/firestore";
import type { GlobalSettings } from "@/types/cms";
import { isRunmoaLoggedIn } from "@/lib/runmoa-session";
import { useAuth } from "@/contexts/AuthContext";
import { canViewContent } from "@/lib/grades";
import { cn } from "@/lib/utils";

/** 상단 메뉴 라벨 → 아이콘 매핑 (요청 20260701: 아이콘+텍스트 버튼) */
const MENU_ICONS: Record<string, LucideIcon> = {
  홈: Home,
  "스마트워크 & AI": BrainCircuit,
  "IT 서비스": Monitor,
  "중소기업 지원사업": Building2,
  "고객 서비스": Headset,
};

/** 외부 링크는 새 탭, 내부 링크는 Next Link로 렌더링 */
function NavLink({
  href,
  external,
  className,
  onClick,
  children,
}: {
  href: string;
  external?: boolean;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(NAV_ITEMS);
  const [loggedIn, setLoggedIn] = useState(false);
  // 데스크톱 드롭다운: 마우스 오버 중인 메뉴만 연다 (클릭 시 즉시 닫힘)
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  // 통합 검색 오버레이
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { profile, isAdmin, loading: authLoading } = useAuth();

  // Cmd/Ctrl + K 로도 검색 열기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 클라이언트에서만 로그인 상태 확인 (정적 export 하이드레이션 안전)
  useEffect(() => {
    setLoggedIn(isRunmoaLoggedIn());
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const settings = await getSingletonDoc<GlobalSettings>(
          COLLECTIONS.SETTINGS,
          GLOBAL_SETTINGS_DOC_ID,
        );
        if (settings?.navItems && settings.navItems.length > 0) {
          setNavItems(settings.navItems);
        }
      } catch {
        // fallback to constants
      }
    })();
  }, []);

  // 등급별 메뉴 필터 (요청 20260701 권한확장) — 로딩 중엔 전체 노출(fail-open), 어드민 전체 노출
  const canSee = (allowedGrades?: string[]) =>
    authLoading || canViewContent(allowedGrades, profile?.grade, isAdmin, !!profile);
  const visibleNav = navItems
    .filter((item) => canSee(item.allowedGrades))
    .map((item) => ({
      ...item,
      children: item.children?.filter((c) => canSee(c.allowedGrades)),
    }));

  return (
    <nav className="fixed w-full z-40 bg-white/95 backdrop-blur shadow-sm py-2">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/" aria-label="WITHCOM AI 홈페이지" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/withcomai_header.png"
                alt="WITHCOM AI"
                className="h-[32px] sm:h-[38px] w-auto"
              />
            </Link>
            <a
              href="https://withuspc.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WITHUS 홈페이지"
              className="shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/withus_logo_001.png"
                alt="WITHUS COMPUTER"
                className="h-10 sm:h-12 w-auto"
              />
            </a>
          </div>

          {/* 데스크톱: 마우스 오버 시에만 드롭다운 (클릭하면 닫힘, 토글 아이콘 없음) */}
          <div className="hidden lg:flex items-center space-x-1">
            {visibleNav.map((item) => {
              const hasChildren = !!(item.children && item.children.length > 0);
              const isOpen = openMenu === item.label;
              const Icon = MENU_ICONS[item.label];
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(item.label)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <NavLink
                    href={item.href}
                    external={item.external}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-base font-bold transition-colors",
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-800 hover:bg-blue-50 hover:text-blue-600",
                    )}
                    onClick={() => setOpenMenu(null)}
                  >
                    {Icon && <Icon className="w-[18px] h-[18px]" />}
                    {item.label}
                  </NavLink>

                  {hasChildren && (
                    <div
                      className={cn(
                        "absolute left-0 top-full pt-2 min-w-[14rem] transition-all duration-150",
                        isOpen
                          ? "opacity-100 visible translate-y-0"
                          : "opacity-0 invisible translate-y-1 pointer-events-none",
                      )}
                    >
                      <div className="rounded-lg border border-gray-100 bg-white shadow-lg py-2">
                        {item.children!.map((child) => (
                          <NavLink
                            key={child.label}
                            href={child.href}
                            external={child.external}
                            className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 whitespace-nowrap"
                            onClick={() => setOpenMenu(null)}
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 검색 + 인증 */}
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-gray-200">
              <button
                type="button"
                aria-label="사이트 검색"
                title="검색 (⌘K)"
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              {/* 로그인 버튼은 상단에서 제거(클라이언트 요청 20260701) — 로그인은 푸터에서. 마이페이지는 로그인 시에만 노출 */}
              {loggedIn && (
                <Link
                  href="/mypage"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <User className="w-4 h-4" /> 마이페이지
                </Link>
              )}
            </div>
          </div>

          {/* 모바일: 검색 + 햄버거 */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              type="button"
              aria-label="사이트 검색"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-700"
            >
              <Search className="w-6 h-6" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-700"
              aria-label="메뉴 열기"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일: 전체 펼침 목록 (토글 아이콘 없음) */}
      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="px-4 py-2 space-y-1">
            {visibleNav.map((item) => {
              const hasChildren = !!(item.children && item.children.length > 0);
              return (
                <div key={item.label}>
                  <NavLink
                    href={item.href}
                    external={item.external}
                    className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                  {hasChildren && (
                    <div className="ml-3 border-l border-gray-100 pl-2 space-y-1 pb-1">
                      {item.children!.map((child) => (
                        <NavLink
                          key={child.label}
                          href={child.href}
                          external={child.external}
                          className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => setOpen(false)}
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 로그인은 푸터에서 (상단 로그인 버튼 제거, 클라이언트 요청 20260701). 마이페이지는 로그인 시에만 */}
            {loggedIn && (
              <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
                <Link
                  href="/mypage"
                  onClick={() => setOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-base font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
                >
                  <User className="w-5 h-5" /> 마이페이지
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 통합 검색 오버레이 */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </nav>
  );
}
