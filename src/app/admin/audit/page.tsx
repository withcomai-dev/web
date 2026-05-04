"use client";

import { useEffect, useState, useMemo } from "react";
import { Activity, RefreshCw, Loader2 } from "lucide-react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit as fbLimit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminPageHeader } from "@/components/admin/AdminTableShell";
import { cn } from "@/lib/utils";

interface AuditDoc {
  id: string;
  actorEmail?: string | null;
  action: "create" | "update" | "delete";
  collection: string;
  docId: string;
  createdAt?: Timestamp;
}

const ACTION_COLOR: Record<AuditDoc["action"], string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-rose-100 text-rose-700",
};

export default function AuditPage() {
  const [items, setItems] = useState<AuditDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState("");
  const [colFilter, setColFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "auditLogs"),
        orderBy("createdAt", "desc"),
        fbLimit(300),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as AuditDoc),
      );
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter(
      (i) =>
        (!actorFilter ||
          (i.actorEmail ?? "").toLowerCase().includes(actorFilter.toLowerCase())) &&
        (!colFilter || i.collection.includes(colFilter)),
    );
  }, [items, actorFilter, colFilter]);

  return (
    <div>
      <AdminPageHeader
        title="활동 로그"
        description="모든 어드민 데이터 변경 이력입니다 (최근 300건)."
        onRefresh={load}
        extra={
          <div className="flex gap-2">
            <input
              type="text"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder="사용자 이메일 필터"
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
            <input
              type="text"
              value={colFilter}
              onChange={(e) => setColFilter(e.target.value)}
              placeholder="컬렉션 필터"
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          기록이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">시각</th>
                <th className="px-4 py-3 text-left">사용자</th>
                <th className="px-4 py-3 text-left">동작</th>
                <th className="px-4 py-3 text-left">컬렉션</th>
                <th className="px-4 py-3 text-left">문서 ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {it.createdAt
                      ? it.createdAt.toDate().toLocaleString("ko-KR")
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{it.actorEmail ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span className={cn("px-2 py-0.5 rounded text-xs font-semibold", ACTION_COLOR[it.action])}>
                      {it.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{it.collection}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{it.docId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
