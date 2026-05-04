import { notFound } from "next/navigation";
import Link from "next/link";
import {
  COLLECTIONS,
  getQueriedCollection,
  where,
  limit,
} from "@/lib/firestore";
import type { HelpDoc } from "@/types/cms";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadBySlug(slug: string): Promise<HelpDoc | null> {
  try {
    const docs = await getQueriedCollection<HelpDoc>(COLLECTIONS.HELP_DOCS, [
      where("slug", "==", slug),
      limit(1),
    ]);
    return docs[0] ?? null;
  } catch {
    return null;
  }
}

export default async function HelpDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await loadBySlug(slug);
  if (!doc || doc.status !== "published") notFound();

  return (
    <article className="py-16 bg-white min-h-[60vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/help"
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← 도움말 센터
        </Link>
        <header className="mb-10 pb-6 border-b border-gray-100">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-4">
            {doc.category}
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900">{doc.title}</h1>
          {doc.updatedAt && (
            <p className="mt-2 text-sm text-gray-400">
              최종 업데이트: {formatDate(doc.updatedAt)}
            </p>
          )}
        </header>
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
        />
      </div>
    </article>
  );
}
