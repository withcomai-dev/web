import { notFound } from "next/navigation";
import Link from "next/link";
import {
  COLLECTIONS,
  getQueriedCollection,
  where,
  limit,
} from "@/lib/firestore";
import type { ContentDoc } from "@/types/cms";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadBySlug(slug: string): Promise<ContentDoc | null> {
  try {
    const docs = await getQueriedCollection<ContentDoc>(COLLECTIONS.CONTENTS, [
      where("slug", "==", slug),
      limit(1),
    ]);
    return docs[0] ?? null;
  } catch {
    return null;
  }
}

export default async function ContentDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await loadBySlug(slug);
  if (!item || item.status !== "published") notFound();

  return (
    <article className="py-16 bg-white min-h-[60vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/contents"
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← 콘텐츠 목록으로
        </Link>
        <header className="mb-10">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-4">
            {item.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            {item.title}
          </h1>
          {item.publishedAt && (
            <p className="text-sm text-gray-500">{formatDate(item.publishedAt)}</p>
          )}
        </header>
        {item.thumbnail && (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full rounded-2xl mb-10"
          />
        )}
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
        />
      </div>
    </article>
  );
}
