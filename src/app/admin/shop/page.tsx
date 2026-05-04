"use client";

import { useState, useMemo } from "react";
import { ExternalLink, Search, Plus } from "lucide-react";
import { useRunmoaContents } from "@/hooks/useRunmoaContents";
import { useDebounce } from "@/hooks/useDebounce";
import {
  RUNMOA_ADMIN_ADD_URL,
  runmoaAdminEditUrl,
} from "@/lib/runmoa-api";
import {
  RUNMOA_CONTENT_TYPE_LABELS,
  RUNMOA_STATUS_LABELS,
  RUNMOA_STATUS_COLORS,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import {
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
} from "@/components/admin/AdminTableShell";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

export default function AdminShopPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      limit: ITEMS_PER_PAGE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, debouncedSearch],
  );

  const { data, pagination, loading, error, refresh } = useRunmoaContents(params);

  return (
    <div>
      <AdminPageHeader
        title="쇼핑몰(런모아)"
        description="상품 등록·수정은 런모아 관리 화면에서 진행됩니다. 본 페이지는 미러 뷰입니다."
        onRefresh={refresh}
        extra={
          <a
            href={RUNMOA_ADMIN_ADD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> 새 상품 등록 <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        }
      />

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="상품 검색"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
      </div>

      {loading && data.length === 0 ? (
        <AdminLoading />
      ) : error ? (
        <p className="text-center py-20 text-rose-600">{error}</p>
      ) : data.length === 0 ? (
        <AdminEmpty />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left w-16"></th>
                <th className="px-4 py-3 text-left">상품명</th>
                <th className="px-4 py-3 text-left">유형</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-right">가격</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((p) => (
                <tr key={p.content_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {p.featured_image && (
                      <img
                        src={p.featured_image}
                        alt=""
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{p.title}</td>
                  <td className="px-4 py-3 text-xs">
                    {RUNMOA_CONTENT_TYPE_LABELS[p.content_type] ?? p.content_type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-semibold",
                        RUNMOA_STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600",
                      )}
                    >
                      {RUNMOA_STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    ₩{formatPrice(p.is_on_sale ? p.sale_price : p.base_price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={runmoaAdminEditUrl(p.content_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="런모아에서 수정"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs text-blue-600 hover:bg-blue-50"
                    >
                      수정 <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.last_page > 1 && (
            <div className="p-4 flex justify-center gap-2 border-t border-gray-100">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-50"
              >
                이전
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={page >= pagination.last_page}
                className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
