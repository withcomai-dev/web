"use client";

import { useEffect, useState, useCallback } from "react";
import { Download } from "lucide-react";
import {
  COLLECTIONS,
  getOrderedCollection,
  invalidateCache,
  updateDocFields,
} from "@/lib/firestore";
import {
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
} from "@/components/admin/AdminTableShell";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile, UserRole, UserStatus } from "@/types/cms";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const { isSuperAdmin, profile: me } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCache(COLLECTIONS.USERS);
      const data = await getOrderedCollection<UserProfile>(
        COLLECTIONS.USERS,
        "createdAt",
        "desc",
      );
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateRole = async (uid: string, role: UserRole) => {
    if (!isSuperAdmin) {
      alert("권한 변경은 슈퍼 관리자만 가능합니다.");
      return;
    }
    await updateDocFields(COLLECTIONS.USERS, uid, { role });
    setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, role } : u)));
  };

  const updateStatus = async (uid: string, status: UserStatus) => {
    await updateDocFields(COLLECTIONS.USERS, uid, { status });
    setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, status } : u)));
  };

  const filtered = search
    ? users.filter(
        (u) =>
          u.email.includes(search) ||
          (u.displayName ?? "").includes(search),
      )
    : users;

  function exportCsv(rows: UserProfile[]) {
    const header = ["이메일", "이름", "권한", "상태", "최근 로그인", "가입일"];
    const lines = [header.join(",")];
    for (const u of rows) {
      const cells = [
        u.email,
        u.displayName ?? "",
        u.role,
        u.status,
        u.lastLoginAt ?? "",
        u.createdAt ?? "",
      ].map((c) => `"${String(c).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    }
    const csv = "﻿" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <AdminPageHeader
        title="회원 관리"
        description="Google 로그인한 회원 목록입니다."
        onRefresh={load}
        extra={
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이메일·이름 검색"
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-64"
            />
            <button
              onClick={() => exportCsv(filtered)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        }
      />

      {loading ? (
        <AdminLoading />
      ) : filtered.length === 0 ? (
        <AdminEmpty />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">회원</th>
                <th className="px-4 py-3 text-left">권한</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">최근 로그인</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.photoURL && (
                        <img
                          src={u.photoURL}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {u.displayName || "(이름 없음)"}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                      disabled={!isSuperAdmin || u.id === me?.id}
                      className="px-2 py-1 rounded border border-gray-200 text-xs disabled:bg-gray-50"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="superadmin">superadmin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        updateStatus(
                          u.id,
                          u.status === "active" ? "suspended" : "active",
                        )
                      }
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-semibold",
                        u.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {u.status === "active" ? "활성" : "정지"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleString("ko-KR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
