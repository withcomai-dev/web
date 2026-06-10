import { COMPANY } from "@/lib/constants";
import { Youtube, BookOpen, ExternalLink } from "lucide-react";
import { PageBanner } from "@/components/sections/HeroSection";

export const metadata = { title: "블로그 및 유튜브" };

export default function YoutubePage() {
  return (
    <>
      <PageBanner
        eyebrow="Blog & YouTube"
        title='영상과 글로 배우는<br class="hidden sm:block"/> <span class="text-blue-400">IT 활용 노하우</span>'
        subtitle="IT 트렌드, 솔루션 활용 가이드, 스마트워크 도입 사례를 유튜브와 블로그로 전합니다."
      />
      <div className="py-12 sm:py-16 bg-slate-50 min-h-[60vh]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* 유튜브·블로그 — 동일한 카드 디자인 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a
              href={COMPANY.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-rose-600 text-white rounded-3xl p-10 sm:p-12 hover:bg-rose-700 transition-colors"
            >
              <Youtube className="w-12 h-12 mb-4 opacity-80" />
              <h2 className="text-2xl font-bold mb-2">공식 유튜브 채널</h2>
              <p className="text-rose-100 mb-6 leading-relaxed">
                IT 트렌드, 솔루션 활용 가이드, 장비 리뷰 영상을 만나보세요.
              </p>
              <span className="inline-flex items-center gap-2 font-bold">
                채널 바로가기 <ExternalLink className="w-5 h-5" />
              </span>
            </a>

            <a
              href={COMPANY.blogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#03C75A] text-white rounded-3xl p-10 sm:p-12 hover:bg-[#02b152] transition-colors"
            >
              <BookOpen className="w-12 h-12 mb-4 opacity-80" />
              <h2 className="text-2xl font-bold mb-2">공식 네이버 블로그</h2>
              <p className="text-green-50 mb-6 leading-relaxed">
                스마트워크·AI 활용 노하우와 도입 사례를 글로 전합니다.
              </p>
              <span className="inline-flex items-center gap-2 font-bold">
                블로그 바로가기 <ExternalLink className="w-5 h-5" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
