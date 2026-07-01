"use client";

import { useEffect, useState, useCallback } from "react";
import { UserCheck, X } from "lucide-react";
import {
  COLLECTIONS,
  getOrderedCollection,
  getCollection,
  upsertDoc,
  invalidateCache,
} from "@/lib/firestore";
import {
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
} from "@/components/admin/AdminTableShell";
import { loadMemberGrades, gradeLabel } from "@/lib/grades";
import type { RunmoaMemberDoc, UserProfile, MemberGrade } from "@/types/cms";

/** ISO 문자열을 한국 시각으로 표시(없으면 —) */
function fmt(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("ko-KR");
}

/** 런모아 회원 → users 문서 uid (등급은 users 문서에 저장) */
function memberUid(m: RunmoaMemberDoc): string {
  return `runmoa:${m.runmoaUserId}`;
}

export default function AdminMembersPage() {
  const [items, setItems] = useState<RunmoaMemberDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RunmoaMemberDoc | null>(null);
  // 회원 등급 (요청 20260701 #8)
  const [grades, setGrades] = useState<MemberGrade[]>([]);
  const [gradeMap, setGradeMap] = useState<Record<string, string>>({});
  const [savingUid, setSavingUid] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCache(COLLECTIONS.RUNMOA_MEMBERS);
      const [data, gradeDefs, users] = await Promise.all([
        getOrderedCollection<RunmoaMemberDoc>(
          COLLECTIONS.RUNMOA_MEMBERS,
          "lastLoginAt",
          "desc",
        ),
        loadMemberGrades(),
        getCollection<UserProfile>(COLLECTIONS.USERS).catch(
          () => [] as UserProfile[],
        ),
      ]);
      setItems(data);
      setGrades(gradeDefs);
      const map: Record<string, string> = {};
      for (const u of users) if (u.id && u.grade) map[u.id] = u.grade;
      setGradeMap(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setGrade = async (m: RunmoaMemberDoc, gradeId: string) => {
    const uid = memberUid(m);
    setSavingUid(uid);
    try {
      await upsertDoc(COLLECTIONS.USERS, uid, { grade: gradeId });
      setGradeMap((prev) => ({ ...prev, [uid]: gradeId }));
    } catch {
      alert(
        "등급 저장에 실패했습니다. 해당 회원의 계정 문서가 아직 없을 수 있어요(회원이 한 번 로그인한 뒤 다시 시도).",
      );
    } finally {
      setSavingUid(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="회원"
        description="런모아 호스티드 로그인으로 접속한 회원 목록입니다. 행을 눌러 회원 등급을 지정할 수 있습니다."
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
                <th className="px-4 py-3 text-left">등급</th>
                <th className="px-4 py-3 text-left">마지막 로그인</th>
                <th className="px-4 py-3 text-right">횟수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((m) => {
                const g = gradeMap[memberUid(m)];
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className="hover:bg-blue-50/50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-semibold">{m.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{m.loginId || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{m.email || "—"}</td>
                    <td className="px-4 py-3">
                      {g ? (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                          {gradeLabel(grades, g)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {fmt(m.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {m.loginCount ?? "—"}
                    </td>
                  </tr>
                );
              })}
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
              {/* 회원 등급 지정 (요청 20260701 #8) */}
              <div className="grid grid-cols-4 gap-3 text-sm items-center bg-blue-50/60 -mx-2 px-2 py-2 rounded-lg">
                <p className="text-gray-600 font-semibold">회원 등급</p>
                <div className="col-span-3">
                  <select
                    value={gradeMap[memberUid(selected)] ?? ""}
                    onChange={(e) => setGrade(selected, e.target.value)}
                    disabled={
                      grades.length === 0 || savingUid === memberUid(selected)
                    }
                    className="w-full px-3 py-2 rounded border border-gray-200 bg-white disabled:opacity-60"
                  >
                    <option value="">— 없음 (전체 공개 콘텐츠만) —</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  {grades.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      [회원 등급] 메뉴에서 먼저 등급을 만들어 주세요.
                    </p>
                  )}
                </div>
              </div>

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
