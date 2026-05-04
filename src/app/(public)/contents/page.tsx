import Link from "next/link";
import {
  COLLECTIONS,
  getOrderedCollection,
} from "@/lib/firestore";
import type { ContentDoc } from "@/types/cms";
import { formatDate, htmlToPlainTextSummary } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadContents(): Promise<ContentDoc[]> {
  try {
    const docs = await getOrderedCollection<ContentDoc>(
      COLLECTIONS.CONTENTS,
      "publishedAt",
      "desc",
    );
    return docs.filter((d) => d.status === "published");
  } catch {
    return [];
  }
}

export default async function ContentsPage() {
  const items = await loadContents();
  return (
    <section className="py-16 bg-slate-50 min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Contents
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">업무활용 콘텐츠</h1>
        </header>

        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-20">
            등록된 콘텐츠가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/contents/${item.slug}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group"
              >
                {item.thumbnail && (
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                        {item.category}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  {item.publishedAt && (
                    <p className="text-sm text-gray-400 mb-2">
                      {formatDate(item.publishedAt)}
                    </p>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {item.summary ?? htmlToPlainTextSummary(item.bodyHtml)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
