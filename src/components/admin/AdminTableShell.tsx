"use client";

import { Loader2, Plus, RefreshCw } from "lucide-react";
import { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  onRefresh,
  onAdd,
  addLabel,
  extra,
}: {
  title: string;
  description?: string;
  onRefresh?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  extra?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="flex gap-2">
        {extra}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" /> 새로고침
          </button>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> {addLabel ?? "추가"}
          </button>
        )}
      </div>
    </header>
  );
}

export function AdminLoading() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );
}

export function AdminEmpty({ message = "등록된 항목이 없습니다." }: { message?: string }) {
  return <p className="text-center text-gray-500 py-20">{message}</p>;
}
