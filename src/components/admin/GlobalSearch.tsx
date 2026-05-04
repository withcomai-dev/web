"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  FileText,
  Mail,
  Users as UsersIcon,
  HelpCircle,
  Bug,
  Layout,
  Briefcase,
} from "lucide-react";
import {
  COLLECTIONS,
  getCollection,
} from "@/lib/firestore";
import type {
  ContentDoc,
  HelpDoc,
  InquiryDoc,
  UserProfile,
  FeedbackReport,
  SmeSupportDoc,
} from "@/types/cms";

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  type: "page" | "content" | "help" | "inquiry" | "user" | "feedback" | "sme";
  href: string;
}

const TYPE_ICON = {
  page: Layout,
  content: FileText,
  help: HelpCircle,
  inquiry: Mail,
  user: UsersIcon,
  feedback: Bug,
  sme: Briefcase,
} as const;

const TYPE_LABEL: Record<SearchItem["type"], string> = {
  page: "페이지",
  content: "콘텐츠",
  help: "도움말",
  inquiry: "문의",
  user: "회원",
  feedback: "신고",
  sme: "지원사업",
};

const ADMIN_PAGES: SearchItem[] = [
  { id: "p-pages", type: "page", title: "페이지·섹션", href: "/admin/pages" },
  { id: "p-contents", type: "page", title: "콘텐츠 관리", href: "/admin/contents" },
  { id: "p-banners", type: "page", title: "배너", href: "/admin/banners" },
  { id: "p-shop", type: "page", title: "쇼핑몰(런모아)", href: "/admin/shop" },
  { id: "p-inquiries", type: "page", title: "문의", href: "/admin/inquiries" },
  { id: "p-users", type: "page", title: "회원 관리", href: "/admin/users" },
  { id: "p-help", type: "page", title: "도움말", href: "/admin/help" },
  { id: "p-feedback", type: "page", title: "버그 신고", href: "/admin/feedback" },
  { id: "p-audit", type: "page", title: "활동 로그", href: "/admin/audit" },
  { id: "p-sme", type: "page", title: "중소기업 지원", href: "/admin/sme-support" },
  { id: "p-settings", type: "page", title: "사이트 설정", href: "/admin/settings" },
];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const router = useRouter();

  // Cmd/Ctrl + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 검색 인덱스 lazy load
  useEffect(() => {
    if (!open || items.length > ADMIN_PAGES.length) return;
    void (async () => {
      try {
        const [contents, helps, inquiries, users, feedbacks, smes] = await Promise.all([
          getCollection<ContentDoc>(COLLECTIONS.CONTENTS).catch(() => []),
          getCollection<HelpDoc>(COLLECTIONS.HELP_DOCS).catch(() => []),
          getCollection<InquiryDoc>(COLLECTIONS.INQUIRIES).catch(() => []),
          getCollection<UserProfile>(COLLECTIONS.USERS).catch(() => []),
          getCollection<FeedbackReport>(COLLECTIONS.FEEDBACK_REPORTS).catch(() => []),
          getCollection<SmeSupportDoc>(COLLECTIONS.SME_SUPPORT).catch(() => []),
        ]);

        const all: SearchItem[] = [
          ...ADMIN_PAGES,
          ...contents.map<SearchItem>((c) => ({
            id: `c-${c.id}`,
            type: "content",
            title: c.title,
            subtitle: c.category,
            href: `/admin/contents`,
          })),
          ...helps.map<SearchItem>((h) => ({
            id: `h-${h.id}`,
            type: "help",
            title: h.title,
            subtitle: h.category,
            href: `/admin/help`,
          })),
          ...inquiries.map<SearchItem>((i) => ({
            id: `i-${i.id}`,
            type: "inquiry",
            title: `${i.name} — ${i.type}`,
            subtitle: i.message.slice(0, 60),
            href: `/admin/inquiries`,
          })),
          ...users.map<SearchItem>((u) => ({
            id: `u-${u.id}`,
            type: "user",
            title: u.displayName || u.email,
            subtitle: u.email,
            href: `/admin/users`,
          })),
          ...feedbacks.map<SearchItem>((f) => ({
            id: `f-${f.id}`,
            type: "feedback",
            title: f.message.slice(0, 60),
            subtitle: f.context.url,
            href: `/admin/feedback`,
          })),
          ...smes.map<SearchItem>((s) => ({
            id: `s-${s.id}`,
            type: "sme",
            title: s.title,
            subtitle: s.agency,
            href: `/admin/sme-support`,
          })),
        ];
        setItems(all);
      } catch {
        setItems(ADMIN_PAGES);
      }
    })();
  }, [open, items.length]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.subtitle ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const g: Partial<Record<SearchItem["type"], SearchItem[]>> = {};
    filtered.forEach((it) => {
      (g[it.type] ??= []).push(it);
    });
    return g;
  }, [filtered]);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="검색 (Cmd+K)"
        className="fixed bottom-24 right-6 z-40 px-3 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50 shadow flex items-center gap-2"
      >
        <Search className="w-3.5 h-3.5" />
        <kbd className="font-mono text-[10px]">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/40"
        onClick={() => setOpen(false)}
      />
      <Command
        className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        loop
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="페이지·콘텐츠·문의·회원·신고 검색..."
            className="flex-1 outline-none text-sm bg-transparent"
            autoFocus
          />
          <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-500">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="py-10 text-center text-sm text-gray-500">
            검색 결과가 없습니다.
          </Command.Empty>
          {(Object.keys(grouped) as SearchItem["type"][]).map((type) => {
            const list = grouped[type] ?? [];
            const Icon = TYPE_ICON[type];
            return (
              <Command.Group
                key={type}
                heading={TYPE_LABEL[type]}
                className="px-2 py-1 text-xs text-gray-400"
              >
                {list.slice(0, 8).map((it) => (
                  <Command.Item
                    key={it.id}
                    value={`${it.title} ${it.subtitle ?? ""}`}
                    onSelect={() => navigate(it.href)}
                    className="flex items-center gap-3 px-2 py-2 rounded cursor-pointer aria-selected:bg-blue-50"
                  >
                    <Icon className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {it.title}
                      </p>
                      {it.subtitle && (
                        <p className="text-xs text-gray-500 truncate">
                          {it.subtitle}
                        </p>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}
        </Command.List>
      </Command>
    </>
  );
}
