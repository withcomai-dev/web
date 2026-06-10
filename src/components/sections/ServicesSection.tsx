import Link from "next/link";
import {
  ShoppingBag,
  Headphones,
  Youtube,
  ChevronRight,
  Globe,
  Sparkles,
} from "lucide-react";
import type { ServicesData } from "@/types/cms";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "shopping-bag": ShoppingBag,
  headphones: Headphones,
  youtube: Youtube,
  globe: Globe,
  sparkles: Sparkles,
};

const BG: Record<string, string> = {
  blue: "bg-blue-600 text-white",
  slate: "bg-slate-800 text-white",
  rose: "bg-red-600 text-white",
  emerald: "bg-emerald-600 text-white",
};

const SUBTITLE_COLOR: Record<string, string> = {
  blue: "text-blue-100",
  slate: "text-slate-300",
  rose: "text-red-100",
  emerald: "text-emerald-100",
};

export default function ServicesSection({ data }: { data: ServicesData }) {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? ShoppingBag;
            const inner = (
              <>
                <div>
                  <Icon className="w-10 h-10 mb-4 opacity-80" />
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className={cn("mt-2 opacity-80", SUBTITLE_COLOR[item.bg])}>
                    {item.body}
                  </p>
                </div>
                <div className="flex items-center font-bold">
                  {item.ctaLabel ?? "바로가기"}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </div>
              </>
            );

            const cls = cn(
              "relative group overflow-hidden rounded-3xl p-10 h-64 flex flex-col justify-between transition-all hover:scale-[1.01]",
              BG[item.bg],
            );

            return item.external ? (
              <a
                key={i}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cls}
              >
                {inner}
              </a>
            ) : (
              <Link key={i} href={item.href} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
