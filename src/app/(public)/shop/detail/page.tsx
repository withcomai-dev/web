"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  getRunmoaContentById,
  RUNMOA_CHECKOUT_URL,
} from "@/lib/runmoa-api";
import type { RunmoaContent } from "@/types/runmoa";
import { formatPrice } from "@/lib/utils";

/**
 * 상품 상세. (정적 export 호환: 쿼리파라미터 ?id=)
 * 런타임에 런모아 API 에서 상품을 조회하므로 어떤 상품이든 재배포 없이 표시된다.
 */
export default function ShopDetailPage() {
  const [item, setItem] = useState<RunmoaContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("id")
        : null;
    if (!id) {
      setError("상품 없음");
      setLoading(false);
      return;
    }
    setLoading(true);
    getRunmoaContentById(Number(id))
      .then((c) => setItem(c))
      .catch((e) => setError(e instanceof Error ? e.message : "오류"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );

  if (error || !item)
    return <div className="text-center py-32 text-rose-600">{error ?? "상품 없음"}</div>;

  return (
    <div className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/shop"
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← 상품 목록으로
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            {item.featured_image && (
              <img
                src={item.featured_image}
                alt={item.title}
                className="w-full rounded-2xl"
              />
            )}
            {item.images && item.images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {item.images.slice(0, 4).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{item.title}</h1>
            <div className="mb-6 flex items-baseline gap-3">
              {item.is_on_sale && item.sale_price < item.base_price && (
                <span className="text-lg text-gray-400 line-through">
                  ₩{formatPrice(item.base_price)}
                </span>
              )}
              <span className="text-3xl font-bold text-blue-600">
                ₩{formatPrice(item.is_on_sale ? item.sale_price : item.base_price)}
              </span>
            </div>

            <div
              className="prose-content mb-8"
              dangerouslySetInnerHTML={{ __html: item.description_html }}
            />

            <a
              href={RUNMOA_CHECKOUT_URL(item.content_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-colors"
            >
              구매하기 (런모아에서 결제)
              <ExternalLink className="w-5 h-5" />
            </a>
            <p className="mt-3 text-xs text-gray-500 text-center">
              구매·결제·배송 문의는 런모아 쇼핑몰에서 안내해드립니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
