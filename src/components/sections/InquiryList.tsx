"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquareText } from "lucide-react";

/** 서버가 마스킹해 내려주는 공개 문의 행 (개인정보 원문 없음) */
interface PublicInquiryItem {
  type: string;
  maskedName: string;
  createdAt: string;
  answered: boolean;
}

/** 문의 제출 직후 리스트를 갱신하기 위한 윈도우 이벤트명 (InquiryForm에서 발행) */
export const INQUIRY_SUBMITTED_EVENT = "inquiry:submitted";

function formatListDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * 공개 문의 내역 리스트 — 공지사항형.
 * 유형·작성자(마스킹)·날짜·답변 상태만 노출하고 문의 내용은 비공개.
 * 로드 실패 시 영역 자체를 숨겨 페이지 흐름을 방해하지 않는다.
 */
export default function InquiryList() {
  const [items, setItems] = useState<PublicInquiryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/inquiries/public", { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as { items?: PublicInquiryItem[] };
      setItems(Array.isArray(data.items) ? data.items : []);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // 문의 제출 완료 시 즉시 갱신
    const onSubmitted = () => void load();
    window.addEventListener(INQUIRY_SUBMITTED_EVENT, onSubmitted);
    return () => window.removeEventListener(INQUIRY_SUBMITTED_EVENT, onSubmitted);
  }, [load]);

  // 로드 실패 시 조용히 숨김 — 문의 폼 사용에는 영향 없음
  if (failed) return null;

  return (
    <div className="mt-10 bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="px-6 sm:px-10 pt-8 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-blue-600" /> 문의 내역
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            최근 접수된 문의입니다. 개인정보 보호를 위해 작성자명은 일부만 표시되며,
            문의 내용은 공개되지 않습니다.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : !items || items.length === 0 ? (
        <p className="text-center text-gray-500 py-14">
          아직 접수된 문의가 없습니다. 첫 문의를 남겨보세요.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 px-2 sm:px-6 pb-4">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex items-center gap-3 sm:gap-4 px-4 py-4"
            >
              <span className="shrink-0 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                {it.type}
              </span>
              <span className="flex-1 min-w-0 truncate text-sm text-gray-700">
                {it.maskedName} 님의 문의
              </span>
              <span className="hidden sm:block shrink-0 text-sm text-gray-400">
                {formatListDate(it.createdAt)}
              </span>
              <span
                className={
                  it.answered
                    ? "shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold"
                    : "shrink-0 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold"
                }
              >
                {it.answered ? "답변완료" : "접수"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
