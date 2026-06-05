import Link from "next/link";
import { COLLECTIONS, getOrderedCollection } from "@/lib/firestore";
import type { HelpDoc } from "@/types/cms";
import { HELP_CATEGORIES } from "@/lib/constants";

async function loadDocs(): Promise<HelpDoc[]> {
  try {
    const docs = await getOrderedCollection<HelpDoc>(COLLECTIONS.HELP_DOCS, "order", "asc");
    return docs.filter(
      (d) =>
        d.status === "published" && (d.audience === "public" || d.audience === "both"),
    );
  } catch {
    return [];
  }
}

export default async function HelpIndex() {
  const docs = await loadDocs();

  return (
    <div className="py-16 bg-slate-50 min-h-[60vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Help Center
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">도움말 센터</h1>
          <p className="mt-3 text-gray-500">
            궁금하신 점을 카테고리별로 모았습니다.
          </p>
        </header>

        {docs.length === 0 ? (
          <p className="text-center text-gray-500 py-20">
            등록된 도움말이 없습니다.
          </p>
        ) : (
          <div className="space-y-10">
            {HELP_CATEGORIES.map((cat) => {
              const items = docs.filter((d) => d.category === cat);
              if (items.length === 0) return null;
              return (
                <section key={cat}>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{cat}</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((doc) => (
                      <li key={doc.id}>
                        <Link
                          href={`/help/${doc.slug}`}
                          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          {doc.thumbnail ? (
                            <img
                              src={doc.thumbnail}
                              alt=""
                              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-blue-50 flex-shrink-0" />
                          )}
                          <p className="font-semibold text-gray-900 line-clamp-2">{doc.title}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
