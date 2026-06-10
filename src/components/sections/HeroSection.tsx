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
 * 배너 (image03/04 패밀리):
 * - bgImage 지정 시: 제공된 배너 이미지를 그대로 노출 (배경 네이비 전체폭 + 이미지 1400px 중앙)
 * - bgImage 없을 시: 동일 톤(네이비 #010c21 + 그리드 + 블루 글로우 + 좌측 액센트바)의
 *   스타일드 텍스트 배너 — 모든 서브 페이지 상단이 같은 시각 언어를 갖도록 한다.
 */
function BannerHero({ data }: { data: HeroData }) {
  const alt = (data.title || "").replace(/<[^>]+>/g, "").trim() || "배너";

  if (!data.bgImage) {
    return (
      <section
        className="relative w-full overflow-hidden"
        style={{ backgroundColor: "#010c21" }}
      >
        {/* 배경 장식: 그리드 + 블루 글로우 (image03/04 톤) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-950/50" />
          <div className="absolute -top-24 right-[12%] h-80 w-80 rounded-full bg-blue-600/25 blur-3xl" />
          <div className="absolute -bottom-32 left-[8%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #6da5ff 1px, transparent 1px), linear-gradient(to bottom, #6da5ff 1px, transparent 1px)",
              backgroundSize: "46px 46px",
            }}
          />
          {/* 우측 장식 링 (일러스트 영역의 추상 대체) */}
          <div className="absolute right-[6%] top-1/2 hidden -translate-y-1/2 lg:block">
            <div className="relative h-44 w-44">
              <div className="absolute inset-0 rounded-3xl border border-blue-400/20 rotate-12" />
              <div className="absolute inset-4 rounded-2xl border border-blue-400/30 -rotate-6" />
              <div className="absolute inset-10 rounded-xl bg-blue-500/15 backdrop-blur-sm border border-blue-300/30" />
            </div>
          </div>
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            {data.eyebrow && (
              <span className="inline-block px-3.5 py-1.5 mb-5 text-xs font-semibold tracking-widest text-blue-300 uppercase bg-blue-400/10 rounded-full border border-blue-400/20">
                {data.eyebrow}
              </span>
            )}
            <div className="flex gap-4">
              <span className="mt-1.5 w-1.5 shrink-0 self-stretch rounded-full bg-gradient-to-b from-blue-400 to-blue-600" />
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight break-keep"
                dangerouslySetInnerHTML={{ __html: data.title }}
              />
            </div>
            {data.subtitle && (
              <p className="mt-5 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed break-keep">
                {data.subtitle}
              </p>
            )}
            {data.ctas && data.ctas.length > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {data.ctas.map((cta, i) => (
                  <Link
                    key={i}
                    href={cta.href}
                    className={cn(
                      "inline-flex items-center justify-center px-7 py-3.5 rounded-lg font-bold transition-all",
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

/**
 * 서브 페이지 공용 상단 배너 — CMS 외 페이지(콘텐츠·유튜브·도움말·쇼핑 등)에서
 * hero(banner)와 동일한 시각 언어를 쓰기 위한 편의 컴포넌트.
 */
export function PageBanner({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <BannerHero data={{ variant: "banner", eyebrow, title, subtitle }} />
  );
}
