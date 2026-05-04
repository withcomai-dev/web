import { Cpu, Zap, MessageSquare, ShieldCheck, Users, Monitor } from "lucide-react";
import type { CardsData } from "@/types/cms";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  zap: Zap,
  "message-square": MessageSquare,
  "shield-check": ShieldCheck,
  users: Users,
  monitor: Monitor,
};

export default function CardsSection({ data }: { data: CardsData }) {
  const cols = data.columns ?? Math.min(4, data.items.length || 1);
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <div className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
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
              <div
                key={i}
                className="p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all group"
              >
                {Icon && (
                  <div className="mb-6 p-3 bg-white rounded-xl shadow-sm inline-block group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-8 h-8" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
