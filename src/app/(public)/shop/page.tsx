"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { useRunmoaContents } from "@/hooks/useRunmoaContents";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPrice } from "@/lib/utils";
import { PageBanner } from "@/components/sections/HeroSection";

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      limit: 12,
      status: "publish" as const,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, debouncedSearch],
  );

  const { data, pagination, loading, error } = useRunmoaContents(params);

  return (
    <>
      <PageBanner
        eyebrow="Shop"
        title='비즈니스 IT의 모든 것,<br class="hidden sm:block"/> <span class="text-blue-400">위드컴정보 쇼핑몰</span>'
        subtitle="업무에 필요한 IT 하드웨어와 소프트웨어를 한곳에서. 결제는 런모아에서 안전하게 진행됩니다."
      />
      <div className="py-16 bg-slate-50 min-h-[60vh]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-md">
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
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {loading && data.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <p className="text-center text-rose-600 py-20">{error}</p>
        ) : data.length === 0 ? (
          <p className="text-center text-gray-500 py-20">상품이 없습니다.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.map((p) => (
                <Link
                  key={p.content_id}
                  href={`/shop/detail?id=${p.content_id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  {p.featured_image && (
                    <img
                      src={p.featured_image}
                      alt={p.title}
                      className="w-full aspect-square object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                      {p.title}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      {p.is_on_sale && p.sale_price < p.base_price && (
                        <span className="text-sm text-gray-400 line-through">
                          ₩{formatPrice(p.base_price)}
                        </span>
                      )}
                      <span className="text-lg font-bold text-blue-600">
                        ₩{formatPrice(p.is_on_sale ? p.sale_price : p.base_price)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {pagination && pagination.last_page > 1 && (
              <div className="mt-10 flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  {pagination.current_page} / {pagination.last_page}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.last_page, p + 1))
                  }
                  disabled={page >= pagination.last_page}
                  className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </>
  );
}
