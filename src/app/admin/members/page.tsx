"use client";

import { useEffect, useState, useCallback } from "react";
import { UserCheck, X } from "lucide-react";
import {
  COLLECTIONS,
  getOrderedCollection,
  invalidateCache,
} from "@/lib/firestore";
import {
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
} from "@/components/admin/AdminTableShell";
import type { RunmoaMemberDoc } from "@/types/cms";

/** ISO 문자열을 한국 시각으로 표시(없으면 —) */
function fmt(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("ko-KR");
}

export default function AdminMembersPage() {
  const [items, setItems] = useState<RunmoaMemberDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RunmoaMemberDoc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCache(COLLECTIONS.RUNMOA_MEMBERS);
      const data = await getOrderedCollection<RunmoaMemberDoc>(
        COLLECTIONS.RUNMOA_MEMBERS,
        "lastLoginAt",
        "desc",
      );
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="회원"
        description="런모아 호스티드 로그인으로 접속한 회원 목록입니다. (로그인 시 자동 기록)"
        onRefresh={load}
      />

      {loading ? (
        <AdminLoading />
      ) : items.length === 0 ? (
        <AdminEmpty />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">이름</th>
                <th className="px-4 py-3 text-left">로그인 ID</th>
                <th className="px-4 py-3 text-left">이메일</th>
                <th className="px-4 py-3 text-left">연락처</th>
                <th className="px-4 py-3 text-left">마지막 로그인</th>
                <th className="px-4 py-3 text-right">횟수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className="hover:bg-blue-50/50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-semibold">{m.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{m.loginId || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{m.email || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{m.phone || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {fmt(m.lastLoginAt)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {m.loginCount ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold">회원 상세</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <Detail label="런모아 ID" value={String(selected.runmoaUserId)} />
              <Detail label="로그인 ID" value={selected.loginId || "—"} />
              <Detail label="이름" value={selected.name || "—"} />
              <Detail label="이메일" value={selected.email || "—"} />
              <Detail label="연락처" value={selected.phone || "—"} />
              <Detail label="소셜 채널" value={selected.socialChannel || "—"} />
              <Detail
                label="마케팅 동의"
                value={selected.marketingAgree || "—"}
              />
              <Detail label="첫 로그인" value={fmt(selected.firstLoginAt)} />
              <Detail label="마지막 로그인" value={fmt(selected.lastLoginAt)} />
              <Detail
                label="로그인 횟수"
                value={String(selected.loginCount ?? "—")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-4 gap-3 text-sm">
      <p className="text-gray-500">{label}</p>
      <p className="col-span-3 text-gray-900 break-all">{value}</p>
    </div>
  );
}
