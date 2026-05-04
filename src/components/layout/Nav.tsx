"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS, SITE_NAME } from "@/lib/constants";
import {
  COLLECTIONS,
  GLOBAL_SETTINGS_DOC_ID,
  getSingletonDoc,
} from "@/lib/firestore";
import type { GlobalSettings } from "@/types/cms";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [navItems, setNavItems] = useState(NAV_ITEMS);

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
          <Link href="/" className="text-2xl font-bold tracking-tighter text-blue-700">
            {SITE_NAME}
          </Link>

          <div className="hidden lg:flex items-baseline space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {item.label}
              </Link>
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

      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
