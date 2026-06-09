"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, X, Save, FileText, Mail, Bug, Loader2 } from "lucide-react";
import {
  COLLECTIONS,
  getOrderedCollection,
  getQueriedCollection,
  invalidateCache,
  updateDocFields,
  where,
} from "@/lib/firestore";
import {
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
} from "@/components/admin/AdminTableShell";
import { useAuth } from "@/contexts/AuthContext";
import type {
  UserProfile,
  UserRole,
  UserStatus,
  ContentDoc,
  InquiryDoc,
  FeedbackReport,
} from "@/types/cms";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const { isSuperAdmin, profile: me } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserProfile | null>(null);

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
    if (selected?.id === uid) setSelected({ ...selected, role });
  };

  const updateStatus = async (uid: string, status: UserStatus) => {
    await updateDocFields(COLLECTIONS.USERS, uid, { status });
    setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, status } : u)));
    if (selected?.id === uid) setSelected({ ...selected, status });
  };

  const updateNote = async (uid: string, adminNote: string) => {
    await updateDocFields(COLLECTIONS.USERS, uid, { adminNote });
    setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, adminNote } : u)));
    if (selected?.id === uid) setSelected({ ...selected, adminNote });
  };

  const filtered = search
    ? users.filter(
        (u) =>
          u.email.includes(search) ||
          (u.displayName ?? "").includes(search),
      )
    : users;

  function exportCsv(rows: UserProfile[]) {
    const header = ["이메일", "이름", "권한", "상태", "최근 로그인", "가입일", "메모"];
    const lines = [header.join(",")];
    for (const u of rows) {
      const cells = [
        u.email,
        u.displayName ?? "",
        u.role,
        u.status,
        u.lastLoginAt ?? "",
        u.createdAt ?? "",
        u.adminNote ?? "",
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
        title="관리자 권한"
        description="런모아 로그인 사용자의 권한(superadmin/admin/user)을 관리합니다. 권한 변경은 슈퍼 관리자만 가능합니다."
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
                <th className="px-4 py-3 text-left">메모</th>
                <th className="px-4 py-3 text-left">최근 로그인</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className="hover:bg-blue-50/40 cursor-pointer"
                >
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
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                    {u.adminNote || "—"}
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

      {selected && (
        <UserDetail
          user={selected}
          onClose={() => setSelected(null)}
          onSaveNote={(note) => updateNote(selected.id, note)}
        />
      )}
    </div>
  );
}

function UserDetail({
  user,
  onClose,
  onSaveNote,
}: {
  user: UserProfile;
  onClose: () => void;
  onSaveNote: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(user.adminNote ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [activity, setActivity] = useState<{
    contents: number;
    inquiries: number;
    feedbacks: number;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [contents, inquiries, feedbacks] = await Promise.all([
          getQueriedCollection<ContentDoc>(COLLECTIONS.CONTENTS, [
            where("authorEmail", "==", user.email),
          ]),
          getQueriedCollection<InquiryDoc>(COLLECTIONS.INQUIRIES, [
            where("email", "==", user.email),
          ]),
          getQueriedCollection<FeedbackReport>(COLLECTIONS.FEEDBACK_REPORTS, [
            where("reporterEmail", "==", user.email),
          ]),
        ]);
        setActivity({
          contents: contents.length,
          inquiries: inquiries.length,
          feedbacks: feedbacks.length,
        });
      } catch {
        setActivity({ contents: 0, inquiries: 0, feedbacks: 0 });
      }
    })();
  }, [user.email]);

  const save = async () => {
    setSaving(true);
    try {
      await onSaveNote(note);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
            )}
            <div>
              <p className="font-bold text-gray-900">
                {user.displayName || "(이름 없음)"}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <section>
            <p className="text-xs font-semibold text-gray-500 mb-2">기본 정보</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Stat label="권한" value={user.role} />
              <Stat label="상태" value={user.status === "active" ? "활성" : "정지"} />
              <Stat
                label="가입일"
                value={user.createdAt ? new Date(user.createdAt).toLocaleString("ko-KR") : "—"}
              />
              <Stat
                label="최근 로그인"
                value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("ko-KR") : "—"}
              />
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-500 mb-2">활동 이력</p>
            {!activity ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <ActivityCard
                  icon={<FileText className="w-4 h-4 text-blue-600" />}
                  label="작성 콘텐츠"
                  value={activity.contents}
                />
                <ActivityCard
                  icon={<Mail className="w-4 h-4 text-emerald-600" />}
                  label="문의 작성"
                  value={activity.inquiries}
                />
                <ActivityCard
                  icon={<Bug className="w-4 h-4 text-rose-600" />}
                  label="버그 신고"
                  value={activity.feedbacks}
                />
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500">관리자 메모</p>
              {savedAt && <span className="text-xs text-emerald-600">저장됨 ✓</span>}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="관리자만 볼 수 있는 메모"
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={save}
                disabled={saving || note === (user.adminNote ?? "")}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                메모 저장
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function ActivityCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-1 mb-1">{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
