import Link from "next/link";
import type { CTAData } from "@/types/cms";
import { cn } from "@/lib/utils";

export default function CTASection({ data }: { data: CTAData }) {
  const bg = data.bg ?? "blue";
  return (
    <section
      className={cn(
        "py-20",
        bg === "blue" && "bg-blue-600 text-white",
        bg === "slate" && "bg-slate-900 text-white",
        bg === "white" && "bg-slate-50 text-slate-900",
      )}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{data.title}</h2>
        {data.body && (
          <p className={cn("text-lg mb-8", bg === "white" ? "text-gray-600" : "text-white/80")}>
            {data.body}
          </p>
        )}
        <Link
          href={data.button.href}
          className={cn(
            "inline-block px-8 py-4 rounded-lg font-bold transition-all",
            bg === "white"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white text-blue-600 hover:bg-blue-50",
          )}
        >
          {data.button.label}
        </Link>
      </div>
    </section>
  );
}
