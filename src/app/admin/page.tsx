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
import type { UserProfile, InquiryDoc, FeedbackReport } from "@/types/cms";

interface Counts {
  contents: number;
  inquiries: number;
  feedback: number;
  users: number;
  helpDocs: number;
  helpQuestions: number;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCollection<{ id: string }>(COLLECTIONS.CONTENTS).catch(() => []),
      getCollection<InquiryDoc>(COLLECTIONS.INQUIRIES).catch(() => []),
      getCollection<FeedbackReport>(COLLECTIONS.FEEDBACK_REPORTS).catch(() => []),
      getCollection<UserProfile>(COLLECTIONS.USERS).catch(() => []),
      getCollection<{ id: string }>(COLLECTIONS.HELP_DOCS).catch(() => []),
      getCollection<{ id: string }>(COLLECTIONS.HELP_QUESTIONS).catch(() => []),
    ])
      .then(([c, i, f, u, hd, hq]) => {
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
