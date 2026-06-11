import Link from "next/link";
import {
  Cpu,
  Zap,
  MessageSquare,
  ShieldCheck,
  Users,
  Monitor,
  Server,
  Network,
  Printer,
  Cloud,
  Database,
  Lock,
  Settings,
  Wrench,
  Bot,
  HardDrive,
  Wifi,
  Laptop,
  Headphones,
  ChevronRight,
} from "lucide-react";
import type { CardsData } from "@/types/cms";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  zap: Zap,
  "message-square": MessageSquare,
  "shield-check": ShieldCheck,
  users: Users,
  monitor: Monitor,
  server: Server,
  network: Network,
  printer: Printer,
  cloud: Cloud,
  database: Database,
  lock: Lock,
  settings: Settings,
  wrench: Wrench,
  bot: Bot,
  "hard-drive": HardDrive,
  wifi: Wifi,
  laptop: Laptop,
  headphones: Headphones,
};

/** href가 있으면 내부/외부 링크로 감싸고, 없으면 기존처럼 정적 카드로 렌더링 */
function CardWrapper({
  href,
  className,
  children,
}: {
  href?: string;
  className: string;
  children: React.ReactNode;
}) {
  if (!href) return <div className={className}>{children}</div>;
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function CardsSection({ data }: { data: CardsData }) {
  if (data.variant === "highlight") {
    return <HighlightCards data={data} />;
  }

  const cols = data.columns ?? Math.min(4, data.items.length || 1);
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {(data.eyebrow || data.title) && (
          <div className="text-center mb-16">
            {data.eyebrow && (
              <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
                {data.eyebrow}
              </h2>
            )}
            {data.title && (
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                {data.title}
              </p>
            )}
            {data.description && (
              <div className="mt-4 max-w-2xl text-lg text-gray-500 mx-auto">
                {data.description}
              </div>
            )}
          </div>
        )}
        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-8",
            cols === 3 && "lg:grid-cols-3",
            cols === 4 && "lg:grid-cols-4",
          )}
        >
          {data.items.map((item, i) => {
            const Icon = item.icon ? ICONS[item.icon] : null;
            return (
              <CardWrapper
                key={i}
                href={item.href}
                className="p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all group block"
              >
                {Icon && (
                  <div className="mb-6 p-3 bg-white rounded-xl shadow-sm inline-block group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-8 h-8" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.body}</p>
                {item.href && (
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:gap-2 transition-all">
                    자세히 보기 <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * 다크 네이비 + 번호형 강조 카드 (image01 스타일).
 * 좌측 큰 번호 배지 + 아이콘 + 제목 + 본문. 반응형 1열(모바일)→2열(lg).
 */
function HighlightCards({ data }: { data: CardsData }) {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-24">
      {/* 배경 장식: 블루 글로우 + 미세 그리드 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {(data.eyebrow || data.title) && (
          <div className="text-center mb-12 sm:mb-14">
            {data.eyebrow && (
              <span className="inline-block px-4 py-1.5 mb-5 text-xs font-semibold tracking-widest text-blue-300 uppercase bg-blue-400/10 rounded-full border border-blue-400/20">
                {data.eyebrow}
              </span>
            )}
            {data.title && (
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white break-keep">
                {data.title}
              </h2>
            )}
            {data.description && (
              <p className="mt-5 max-w-2xl mx-auto text-lg text-slate-300 leading-relaxed break-keep">
                {data.description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {data.items.map((item, i) => {
            const Icon = item.icon ? ICONS[item.icon] : null;
            const num = String(i + 1).padStart(2, "0");
            return (
              <CardWrapper
                key={i}
                href={item.href}
                className="group relative flex gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-sm transition-all hover:border-blue-400/40 hover:bg-white/[0.07]"
              >
                {/* 번호 + 아이콘 */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-extrabold text-white shadow-lg shadow-blue-900/40">
                    {num}
                  </span>
                  {Icon && (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-blue-300 transition-colors group-hover:text-blue-200">
                      <Icon className="h-5 w-5" />
                    </span>
                  )}
                </div>
                {/* 텍스트 */}
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 break-keep">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-[15px] leading-relaxed text-slate-300 break-keep">
                    {item.body}
                  </p>
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
