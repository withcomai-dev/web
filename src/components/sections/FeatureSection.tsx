import { Cpu, Zap, MessageSquare, ShieldCheck, Users, Monitor } from "lucide-react";
import type { FeatureData } from "@/types/cms";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  zap: Zap,
  "message-square": MessageSquare,
  "shield-check": ShieldCheck,
  users: Users,
  monitor: Monitor,
};

export default function FeatureSection({ data }: { data: FeatureData }) {
  const isLeft = data.side === "left";
  return (
    <section className="py-24 bg-slate-900 text-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex flex-col lg:flex-row items-center gap-16",
            isLeft && "lg:flex-row-reverse",
          )}
        >
          <div className="lg:w-1/2">
            {data.eyebrow && (
              <h2 className="text-base font-semibold text-blue-400 tracking-wide uppercase mb-4">
                {data.eyebrow}
              </h2>
            )}
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8 leading-tight">
              {data.title}
            </h3>
            <div className="space-y-6">
              {data.items.map((item, i) => {
                const Icon = item.icon ? ICONS[item.icon] : null;
                return (
                  <div key={i} className="flex gap-4">
                    {Icon && (
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                        <Icon className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-gray-400">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {data.image && (
            <div className="lg:w-1/2 relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img src={data.image} alt="" className="w-full h-auto" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
