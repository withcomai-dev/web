import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BlogData } from "@/types/cms";

export default function BlogSection({ data }: { data: BlogData }) {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            {data.eyebrow && (
              <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
                {data.eyebrow}
              </h2>
            )}
            <p className="mt-2 text-3xl font-extrabold text-gray-900">
              {data.title}
            </p>
          </div>
          {data.viewAllHref && (
            <Link
              href={data.viewAllHref}
              className="mt-4 md:mt-0 text-blue-600 font-bold flex items-center hover:underline"
            >
              전체 보기 <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.items.map((item, i) => {
            const Wrapper = item.href ? Link : "article";
            const wrapperProps = item.href
              ? { href: item.href }
              : ({} as Record<string, never>);
            return (
              // @ts-expect-error - dynamic component selection
              <Wrapper
                key={i}
                {...wrapperProps}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer block"
              >
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
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">{item.date}</p>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2">{item.summary}</p>
                </div>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
