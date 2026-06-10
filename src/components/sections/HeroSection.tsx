import Link from "next/link";
import type { HeroData } from "@/types/cms";
import { cn } from "@/lib/utils";

export default function HeroSection({ data }: { data: HeroData }) {
  if (data.variant === "banner") {
    return <BannerHero data={data} />;
  }

  return (
    <section className="relative h-screen -mt-20 flex items-center justify-center overflow-hidden bg-slate-900">
      {data.bgImage && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.bgImage}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900" />
        </div>
      )}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto text-center px-4 sm:px-6 lg:px-8">
        {data.eyebrow && (
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-blue-400 uppercase bg-blue-400/10 rounded-full border border-blue-400/20">
            {data.eyebrow}
          </span>
        )}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight break-keep"
          dangerouslySetInnerHTML={{ __html: data.title }}
        />
        {data.subtitle && (
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto font-light leading-relaxed break-keep">
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

/**
 * 이미지 배너 (image03/04): 제공된 배너 이미지를 그대로 노출한다.
 * - 배경(네이비)은 화면 전체 폭으로 확장하고, 이미지는 컨테이너 폭(max-w-[1400px])에 맞춰 중앙 배치.
 * - 이미지 가장자리 색(#010c21)과 동일한 배경을 써서 넓은 화면에서도 이음매 없이 보인다.
 */
function BannerHero({ data }: { data: HeroData }) {
  const alt = (data.title || "").replace(/<[^>]+>/g, "").trim() || "배너";

  // 배너 이미지가 없으면 기존 텍스트형으로 폴백
  if (!data.bgImage) {
    return (
      <section className="bg-slate-950 py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-white"
            dangerouslySetInnerHTML={{ __html: data.title }}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full" style={{ backgroundColor: "#010c21" }}>
      <div className="max-w-[1400px] mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.bgImage}
          alt={alt}
          className="block w-full h-auto"
          fetchPriority="high"
        />
      </div>
    </section>
  );
}
