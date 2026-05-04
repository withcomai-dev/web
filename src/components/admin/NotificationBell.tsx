"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Mail, Bug, MessageSquare } from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface Counts {
  inquiries: number;
  feedback: number;
  helpQ: number;
}

export default function NotificationBell() {
  const [counts, setCounts] = useState<Counts>({ inquiries: 0, feedback: 0, helpQ: 0 });
  const [open, setOpen] = useState(false);
  const total = counts.inquiries + counts.feedback + counts.helpQ;

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    try {
      unsubs.push(
        onSnapshot(
          query(collection(db, "inquiries"), where("status", "==", "new")),
          (snap) => setCounts((c) => ({ ...c, inquiries: snap.size })),
          () => {},
        ),
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, "feedbackReports"), where("status", "==", "open")),
          (snap) => setCounts((c) => ({ ...c, feedback: snap.size })),
          () => {},
        ),
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, "helpQuestions"), where("status", "==", "open")),
          (snap) => setCounts((c) => ({ ...c, helpQ: snap.size })),
          () => {},
        ),
      );
    } catch {
      // ignore
    }
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <div className="fixed top-24 right-6 z-40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-12 h-12 rounded-full bg-white border border-gray-200 hover:bg-gray-50 shadow flex items-center justify-center"
        title="알림"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-14 right-0 z-40 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-100 font-semibold text-sm">알림</div>
            <NotifRow
              href="/admin/inquiries"
              icon={<Mail className="w-4 h-4 text-emerald-600" />}
              label="신규 문의"
              count={counts.inquiries}
              onClick={() => setOpen(false)}
            />
            <NotifRow
              href="/admin/feedback"
              icon={<Bug className="w-4 h-4 text-rose-600" />}
              label="새 버그 신고"
              count={counts.feedback}
              onClick={() => setOpen(false)}
            />
            <NotifRow
              href="/admin/help"
              icon={<MessageSquare className="w-4 h-4 text-blue-600" />}
              label="받은 질문"
              count={counts.helpQ}
              onClick={() => setOpen(false)}
            />
            {total === 0 && (
              <p className="p-6 text-center text-sm text-gray-500">새 알림이 없습니다.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NotifRow({
  href,
  icon,
  label,
  count,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  if (count === 0) return null;
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
    >
      {icon}
      <span className="flex-1 text-sm text-gray-700">{label}</span>
      <span
        className={cn(
          "min-w-[24px] h-5 px-1 rounded-full text-xs font-bold flex items-center justify-center",
          "bg-rose-100 text-rose-700",
        )}
      >
        {count}
      </span>
    </Link>
  );
}
