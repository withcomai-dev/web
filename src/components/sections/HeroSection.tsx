import Link from "next/link";
import type { HeroData } from "@/types/cms";
import { cn } from "@/lib/utils";

export default function HeroSection({ data }: { data: HeroData }) {
  return (
    <section className="relative h-screen -mt-20 flex items-center justify-center overflow-hidden bg-slate-900">
      {data.bgImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={data.bgImage}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900" />
        </div>
      )}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        {data.eyebrow && (
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-blue-400 uppercase bg-blue-400/10 rounded-full border border-blue-400/20">
            {data.eyebrow}
          </span>
        )}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight"
          dangerouslySetInnerHTML={{ __html: data.title }}
        />
        {data.subtitle && (
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            {data.subtitle}
          </p>
        )}
        {data.ctas && data.ctas.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {data.ctas.map((cta, i) => (
              <Link
                key={i}
                href={cta.href}
                className={cn(
                  "w-full sm:w-auto px-8 py-4 rounded-lg font-bold transition-all",
                  cta.variant === "ghost"
                    ? "bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20",
                )}
              >
                {cta.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
