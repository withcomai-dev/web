import Link from "next/link";
import {
  Server,
  ShieldCheck,
  Cloud,
  Database,
  Cpu,
  MessageSquare,
  Send,
  CheckCircle2,
} from "lucide-react";
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

/**
 * 컴팩트 배너 (image03/04 스타일): 다크 네이비 배경 + 좌측 블루 액센트바 헤드라인 + 우측 일러스트.
 * 고정 내비 아래(in-flow)에 위치하며 PC/모바일 모두 자연스럽게 스택된다.
 */
function BannerHero({ data }: { data: HeroData }) {
  return (
    <section className="relative overflow-hidden bg-slate-950">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40" />
        <div className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-12">
          {/* 좌측 텍스트 */}
          <div>
            {data.eyebrow && (
              <span className="inline-block px-3.5 py-1.5 mb-5 text-xs font-semibold tracking-widest text-blue-300 uppercase bg-blue-400/10 rounded-full border border-blue-400/20">
                {data.eyebrow}
              </span>
            )}
            <div className="flex gap-4">
              <span className="mt-1.5 w-1.5 shrink-0 self-stretch rounded-full bg-gradient-to-b from-blue-400 to-blue-600" />
              <h1
                className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight break-keep"
                dangerouslySetInnerHTML={{ __html: data.title }}
              />
            </div>
            {data.subtitle && (
              <p className="mt-5 max-w-xl text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed break-keep">
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

          {/* 우측 일러스트 */}
          <div className="hidden sm:block">
            {data.illustration === "consult" ? (
              <ConsultArt />
            ) : data.illustration === "it" ? (
              <ItInfraArt />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/** IT 인프라 일러스트: 중앙 보안 실드 + 주변 인프라 아이콘 칩 (image03 느낌) */
function ItInfraArt() {
  const chips = [
    { Icon: Server, label: "서버" },
    { Icon: Cloud, label: "클라우드" },
    { Icon: Database, label: "데이터" },
    { Icon: Cpu, label: "AI PC" },
  ];
  return (
    <div className="relative mx-auto flex max-w-md items-center justify-center py-4">
      {/* 중앙 실드 */}
      <div className="relative flex h-40 w-40 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-sm shadow-2xl shadow-blue-900/40">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 to-transparent" />
        <ShieldCheck className="relative h-20 w-20 text-blue-400" strokeWidth={1.5} />
      </div>
      {/* 주변 칩 */}
      <div className="ml-5 grid grid-cols-2 gap-3">
        {chips.map(({ Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
          >
            <Icon className="h-7 w-7 text-blue-300" strokeWidth={1.6} />
            <span className="text-xs font-medium text-slate-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 상담 신청 일러스트: 간편로그인 칩 + 상담 카드 (image04 느낌) */
function ConsultArt() {
  return (
    <div className="relative mx-auto flex max-w-md flex-col items-center gap-5 py-2">
      {/* 간편 로그인 제공자 칩 */}
      <div className="flex items-center gap-3">
        <ProviderChip label="Google" className="bg-white text-slate-700" mark="G" markClass="text-blue-600" />
        <ProviderChip label="NAVER" className="bg-[#03C75A] text-white" mark="N" markClass="text-white" />
        <ProviderChip label="kakao" className="bg-[#FEE500] text-[#3C1E1E]" mark="K" markClass="text-[#3C1E1E]" />
      </div>

      {/* 상담 신청 카드 */}
      <div className="w-full rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm shadow-2xl shadow-blue-900/40">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <MessageSquare className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-white">상담 신청</span>
        </div>
        <div className="space-y-2.5">
          <div className="h-9 rounded-lg border border-white/10 bg-white/[0.04]" />
          <div className="h-9 rounded-lg border border-white/10 bg-white/[0.04]" />
          <div className="h-16 rounded-lg border border-white/10 bg-white/[0.04]" />
        </div>
        <div className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-sm font-semibold text-white">
          <Send className="h-4 w-4" /> 상담 신청하기
        </div>
      </div>

      {/* 접수 완료 배지 */}
      <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-300">
        <CheckCircle2 className="h-4 w-4" /> 접수 즉시 담당자 확인
      </div>
    </div>
  );
}

function ProviderChip({
  label,
  mark,
  className,
  markClass,
}: {
  label: string;
  mark: string;
  className: string;
  markClass: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold shadow-lg",
        className,
      )}
    >
      <span className={cn("text-base font-extrabold", markClass)}>{mark}</span>
      <span>{label}</span>
    </div>
  );
}
