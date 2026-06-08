"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import {
  COLLECTIONS,
  GLOBAL_SETTINGS_DOC_ID,
  getSingletonDoc,
} from "@/lib/firestore";
import type { GlobalSettings } from "@/types/cms";

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
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="https://withcom.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WITHCOM AI 홈페이지"
              className="shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/withcom_logo_002.png"
                alt="WITHCOM AI"
                className="h-10 sm:h-12 w-auto"
              />
            </a>
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

          {/* 데스크톱: 호버/포커스 드롭다운 */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <div key={item.label} className="relative group">
                <NavLink
                  href={item.href}
                  external={item.external}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {item.label}
                  {item.children && item.children.length > 0 && (
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                  )}
                </NavLink>

                {item.children && item.children.length > 0 && (
                  <div className="absolute left-0 top-full pt-2 min-w-[14rem] opacity-0 invisible translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0">
                    <div className="rounded-lg border border-gray-100 bg-white shadow-lg py-2">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.label}
                          href={child.href}
                          external={child.external}
                          className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 whitespace-nowrap"
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="lg:hidden p-2 text-gray-700"
            aria-label="메뉴 열기"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 모바일: 아코디언 */}
      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => {
              const hasChildren = !!(item.children && item.children.length > 0);
              const expanded = mobileExpanded === item.label;
              return (
                <div key={item.label}>
                  <div className="flex items-center">
                    <NavLink
                      href={item.href}
                      external={item.external}
                      className="flex-1 block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                    {hasChildren && (
                      <button
                        type="button"
                        aria-label={`${item.label} 하위 메뉴`}
                        aria-expanded={expanded}
                        className="p-2 text-gray-500"
                        onClick={() =>
                          setMobileExpanded(expanded ? null : item.label)
                        }
                      >
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                  {hasChildren && expanded && (
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
          </div>
        </div>
      )}
    </nav>
  );
}
