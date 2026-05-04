import { COMPANY } from "@/lib/constants";
import { Youtube, ExternalLink } from "lucide-react";

export const metadata = { title: "유튜브 자료실" };

export default function YoutubePage() {
  return (
    <div className="py-16 bg-slate-50 min-h-[60vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="text-sm font-semibold text-rose-600 uppercase tracking-wide">
            YouTube
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">유튜브 자료실</h1>
          <p className="mt-2 text-gray-500">
            IT 트렌드 및 솔루션 활용 가이드 영상을 제공합니다.
          </p>
        </header>

        <a
          href={COMPANY.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-rose-600 text-white rounded-3xl p-12 hover:bg-rose-700 transition-colors"
        >
          <Youtube className="w-12 h-12 mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">위더스컴퓨터(주) 공식 채널</h2>
          <p className="text-rose-100 mb-6">
            새 탭에서 유튜브 채널을 열어 모든 영상을 확인할 수 있습니다.
          </p>
          <span className="inline-flex items-center gap-2 font-bold">
            채널 바로가기 <ExternalLink className="w-5 h-5" />
          </span>
        </a>
      </div>
    </div>
  );
}
