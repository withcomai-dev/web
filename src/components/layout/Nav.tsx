"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LogIn, LogOut, Search } from "lucide-react";
import SearchOverlay from "@/components/layout/SearchOverlay";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import {
  COLLECTIONS,
  GLOBAL_SETTINGS_DOC_ID,
  getSingletonDoc,
} from "@/lib/firestore";
import type { GlobalSettings } from "@/types/cms";
import { startRunmoa } from "@/lib/runmoa-auth";
import { isRunmoaLoggedIn } from "@/lib/runmoa-session";
import { fullLogout } from "@/lib/logout";
import { cn } from "@/lib/utils";

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

  const handleLogout = () => {
    setOpen(false);
    // 런모아·Firebase·모든 저장소 정리 후 로그인 화면으로 이동(페이지 리로드).
    void fullLogout();
  };

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

  return (
    <nav className="fixed w-full z-40 bg-white/95 backdrop-blur shadow-sm py-2">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/" aria-label="WITHCOM AI 홈페이지" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/withcomai_01_color.png"
                alt="WITHCOM AI"
                className="h-[25px] sm:h-[31px] w-auto"
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
            {navItems.map((item) => {
              const hasChildren = !!(item.children && item.children.length > 0);
              const isOpen = openMenu === item.label;
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
                    className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    onClick={() => setOpenMenu(null)}
                  >
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
              {loggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> 로그아웃
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startRunmoa("login")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="w-4 h-4" /> 로그인
                </button>
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
            {navItems.map((item) => {
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

            {/* 인증: 런모아 로그인/회원가입 (모바일) */}
            <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
              {loggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-base font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
                >
                  <LogOut className="w-5 h-5" /> 로그아웃
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    startRunmoa("login");
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-base font-semibold text-white bg-blue-600 hover:bg-blue-700"
                >
                  <LogIn className="w-5 h-5" /> 로그인
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 통합 검색 오버레이 */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </nav>
  );
}
