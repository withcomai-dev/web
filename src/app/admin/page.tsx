"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Mail,
  Bug,
  Users,
  HelpCircle,
  ShoppingBag,
  Eye,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { COLLECTIONS, getCollection } from "@/lib/firestore";
import type {
  UserProfile,
  InquiryDoc,
  FeedbackReport,
  ContentDoc,
  SiteVisitDoc,
} from "@/types/cms";

interface Counts {
  contents: number;
  inquiries: number;
  feedback: number;
  users: number;
  helpDocs: number;
  helpQuestions: number;
}

/** KST 기준 offsetDays 일 전 날짜 (YYYY-MM-DD) — siteVisits 문서 id 와 정합 */
function kstYmd(offsetDays = 0): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

/** 경로 → 한글 라벨 (인기 페이지 표시용) */
const PATH_LABELS: Record<string, string> = {
  "/": "홈",
  "/about": "회사 소개",
  "/contents": "업무활용 콘텐츠",
  "/ai-tools": "AI TOOL 소개",
  "/smartwork-ai": "스마트워크 & AI",
  "/sme-support": "중소기업 지원",
  "/it-service": "IT 서비스",
  "/contact": "문의",
  "/shop": "쇼핑",
  "/notice": "공지사항",
  "/youtube": "유튜브",
  "/mypage": "마이페이지",
  "/help": "도움말",
};
function pathLabel(p: string): string {
  if (PATH_LABELS[p]) return PATH_LABELS[p];
  const seg = "/" + (p.split("/")[1] ?? "");
  return PATH_LABELS[seg] ? `${PATH_LABELS[seg]} 상세` : p;
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts>({
    contents: 0,
    inquiries: 0,
    feedback: 0,
    users: 0,
    helpDocs: 0,
    helpQuestions: 0,
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [inquiries, setInquiries] = useState<InquiryDoc[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackReport[]>([]);
  const [contents, setContents] = useState<ContentDoc[]>([]);
  const [visits, setVisits] = useState<SiteVisitDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCollection<ContentDoc>(COLLECTIONS.CONTENTS).catch(() => []),
      getCollection<InquiryDoc>(COLLECTIONS.INQUIRIES).catch(() => []),
      getCollection<FeedbackReport>(COLLECTIONS.FEEDBACK_REPORTS).catch(() => []),
      getCollection<UserProfile>(COLLECTIONS.USERS).catch(() => []),
      getCollection<{ id: string }>(COLLECTIONS.HELP_DOCS).catch(() => []),
      getCollection<{ id: string }>(COLLECTIONS.HELP_QUESTIONS).catch(() => []),
      getCollection<SiteVisitDoc>(COLLECTIONS.SITE_VISITS).catch(() => []),
    ])
      .then(([c, i, f, u, hd, hq, v]) => {
        setCounts({
          contents: c.length,
          inquiries: i.length,
          feedback: f.length,
          users: u.length,
          helpDocs: hd.length,
          helpQuestions: hq.length,
        });
        setUsers(u);
        setInquiries(i);
        setFeedbacks(f);
        setContents(c);
        setVisits(v);
      })
      .finally(() => setLoading(false));
  }, []);

  const last30 = useMemo(() => {
    const days: { date: string; users: number; inquiries: number; feedback: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ymd = d.toISOString().slice(0, 10);
      days.push({ date: ymd.slice(5), users: 0, inquiries: 0, feedback: 0 });
    }
    const idx = (ymd: string) => days.findIndex((x) => x.date === ymd);
    // createdAt 는 ISO 문자열일 수도, Firestore Timestamp 객체일 수도 있어 안전하게 MM-DD 로.
    const mmdd = (v: unknown): string | null => {
      if (!v) return null;
      if (typeof v === "string") return v.slice(5, 10);
      const ts = v as { toDate?: () => Date };
      if (typeof ts.toDate === "function") return ts.toDate().toISOString().slice(5, 10);
      if (v instanceof Date) return v.toISOString().slice(5, 10);
      if (typeof v === "number") return new Date(v).toISOString().slice(5, 10);
      return null;
    };
    users.forEach((u) => {
      const k = mmdd(u.createdAt);
      const i = k ? idx(k) : -1;
      if (i >= 0) days[i].users++;
    });
    inquiries.forEach((it) => {
      const k = mmdd(it.createdAt);
      const i = k ? idx(k) : -1;
      if (i >= 0) days[i].inquiries++;
    });
    feedbacks.forEach((it) => {
      const k = mmdd(it.createdAt);
      const i = k ? idx(k) : -1;
      if (i >= 0) days[i].feedback++;
    });
    return days;
  }, [users, inquiries, feedbacks]);

  const inquiryByType = useMemo(() => {
    const m = new Map<string, number>();
    inquiries.forEach((it) => m.set(it.type, (m.get(it.type) ?? 0) + 1));
    return Array.from(m.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [inquiries]);

  // ── 홈페이지 방문 집계 (siteVisits) ──
  const visitsByDate = useMemo(() => {
    const m = new Map<string, SiteVisitDoc>();
    visits.forEach((v) => m.set(v.date ?? v.id ?? "", v));
    return m;
  }, [visits]);

  const visit30 = useMemo(() => {
    const days: { date: string; pv: number; uv: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const ymd = kstYmd(i);
      const v = visitsByDate.get(ymd);
      days.push({ date: ymd.slice(5), pv: v?.pageviews ?? 0, uv: v?.uniques ?? 0 });
    }
    return days;
  }, [visitsByDate]);

  const visitStats = useMemo(() => {
    const today = visitsByDate.get(kstYmd(0));
    return {
      todayPv: today?.pageviews ?? 0,
      todayUv: today?.uniques ?? 0,
      pv30: visit30.reduce((s, d) => s + d.pv, 0),
      uv30: visit30.reduce((s, d) => s + d.uv, 0),
    };
  }, [visitsByDate, visit30]);

  const topPaths = useMemo(() => {
    const recent = new Set<string>();
    for (let i = 0; i < 30; i++) recent.add(kstYmd(i));
    const counts = new Map<string, number>(); // 안전키 → 합계
    const labels = new Map<string, string>(); // 안전키 → 원본 경로
    visits.forEach((v) => {
      const date = v.date ?? v.id ?? "";
      if (!recent.has(date)) return;
      Object.entries(v.paths ?? {}).forEach(([k, n]) =>
        counts.set(k, (counts.get(k) ?? 0) + (n ?? 0)),
      );
      Object.entries(v.pathLabels ?? {}).forEach(([k, p]) => labels.set(k, p));
    });
    return Array.from(counts.entries())
      .map(([k, count]) => ({ path: labels.get(k) ?? k, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [visits]);

  const topContents = useMemo(
    () =>
      [...contents]
        .filter((c) => (c.viewCount ?? 0) > 0)
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, 5),
    [contents],
  );

  const hasVisitData = visitStats.pv30 > 0;

  const cards = [
    { key: "contents", label: "업무활용 콘텐츠", value: counts.contents, href: "/admin/contents", icon: FileText, color: "text-blue-600" },
    { key: "inquiries", label: "문의", value: counts.inquiries, href: "/admin/inquiries", icon: Mail, color: "text-emerald-600" },
    { key: "users", label: "회원", value: counts.users, href: "/admin/users", icon: Users, color: "text-violet-600" },
    // 숨김 기능(버그 신고·도움말) 카드 — 사이드바 숨김과 함께 미노출, 필요 시 주석 해제
    // { key: "feedback", label: "버그 신고", value: counts.feedback, href: "/admin/feedback", icon: Bug, color: "text-rose-600" },
    // { key: "helpDocs", label: "도움말 글", value: counts.helpDocs, href: "/admin/help", icon: HelpCircle, color: "text-amber-600" },
    // { key: "helpQuestions", label: "받은 질문", value: counts.helpQuestions, href: "/admin/help", icon: HelpCircle, color: "text-cyan-600" },
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">사이트의 주요 데이터를 한눈에 확인합니다.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.key}
              href={c.href}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <Icon className={`w-6 h-6 ${c.color} mb-3`} />
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">
                {loading ? "—" : c.value}
              </p>
            </Link>
          );
        })}
      </div>

      {/* ── 홈페이지 방문 대시보드 ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-gray-900">홈페이지 방문</h2>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          방문 집계는 도입 시점부터 쌓입니다. (PV=페이지뷰 · 순방문=하루 방문자 수)
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "오늘 방문(PV)", value: visitStats.todayPv },
            { label: "오늘 순방문", value: visitStats.todayUv },
            { label: "최근 30일 방문(PV)", value: visitStats.pv30 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900 tabular-nums">
                {loading ? "—" : s.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 py-10 text-center">로딩 중...</p>
        ) : !hasVisitData ? (
          <p className="text-sm text-gray-400 py-10 text-center">
            아직 방문 데이터가 없습니다. 배포 후 실제 방문이 집계되면 표시됩니다.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={visit30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pv" stroke="#2563eb" strokeWidth={2} name="페이지뷰" />
              <Line type="monotone" dataKey="uv" stroke="#7c3aed" strokeWidth={2} name="순방문" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── 인기 콘텐츠 · 인기 페이지 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-900">인기 콘텐츠 TOP 5</h2>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">로딩 중...</p>
          ) : topContents.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              아직 조회 데이터가 없습니다.
            </p>
          ) : (
            <ol className="space-y-2">
              {topContents.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-gray-400 tabular-nums">
                    {i + 1}
                  </span>
                  <Link
                    href={`/contents/view?slug=${encodeURIComponent(c.slug)}`}
                    target="_blank"
                    className="flex-1 truncate text-sm text-gray-800 hover:text-blue-600 hover:underline"
                    title={c.title}
                  >
                    {c.title}
                  </Link>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {(c.viewCount ?? 0).toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900">인기 페이지 (최근 30일)</h2>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">로딩 중...</p>
          ) : topPaths.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              아직 방문 데이터가 없습니다.
            </p>
          ) : (
            <ol className="space-y-2">
              {topPaths.map((p, i) => (
                <li key={p.path} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-gray-400 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm text-gray-800" title={p.path}>
                    {pathLabel(p.path)}
                    <span className="ml-1.5 text-xs text-gray-400">{p.path}</span>
                  </span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {p.count.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">최근 30일 활동</h2>
          {loading ? (
            <p className="text-sm text-gray-400 py-10 text-center">로딩 중...</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={last30}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2} name="가입" />
                <Line type="monotone" dataKey="inquiries" stroke="#10b981" strokeWidth={2} name="문의" />
                <Line type="monotone" dataKey="feedback" stroke="#ef4444" strokeWidth={2} name="신고" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">문의 유형별 분포</h2>
          {loading ? (
            <p className="text-sm text-gray-400 py-10 text-center">로딩 중...</p>
          ) : inquiryByType.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">데이터 없음</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={inquiryByType} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 런모아 쇼핑몰 위젯 — 사이드바 숨김과 함께 미노출, 필요 시 주석 해제
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-gray-900">런모아 쇼핑몰</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          상품 등록·수정은 런모아 관리 화면에서 진행합니다.
        </p>
        <Link
          href="/admin/shop"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          런모아 상품 보기 →
        </Link>
      </div>
      */}
    </div>
  );
}
