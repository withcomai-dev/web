import { COMPANY } from "@/lib/constants";
import { Youtube, ExternalLink, ArrowRight } from "lucide-react";
import { PageBanner } from "@/components/sections/HeroSection";

export const metadata = { title: "블로그 및 유튜브" };

const BLOG_URL = "https://naver.me/5UV1WrvA";
const BLOG_THUMBNAIL =
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000";

export default function YoutubePage() {
  return (
    <>
      <PageBanner
        eyebrow="Blog & YouTube"
        title='영상과 글로 배우는<br class="hidden sm:block"/> <span class="text-blue-400">IT 활용 노하우</span>'
        subtitle="IT 트렌드, 솔루션 활용 가이드, 스마트워크 도입 사례를 유튜브와 블로그로 전합니다."
      />
      <div className="py-16 bg-slate-50 min-h-[60vh]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* 블로그 영역 */}
        <section className="mt-14">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">블로그</h2>
          <p className="text-gray-500 mb-6">
            스마트워크와 AI 활용 노하우, 도입 사례를 블로그에서 만나보세요.
          </p>

          <a
            href={BLOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block sm:flex overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="sm:w-2/5 aspect-[16/10] sm:aspect-auto overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BLOG_THUMBNAIL}
                alt="WITHCOM AI 블로그"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex-1 p-8 flex flex-col justify-center">
              <span className="inline-block w-fit text-xs font-semibold text-green-700 bg-green-50 rounded-full px-3 py-1 mb-3">
                BLOG
              </span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                WITHCOM AI 공식 블로그
              </h3>
              <p className="text-gray-500 mb-5 leading-relaxed">
                스마트워크 도입, 생성형 AI 실무 활용, IT 인프라 구축 등 중소기업에
                바로 도움이 되는 콘텐츠를 정기적으로 발행합니다.
              </p>
              <span className="inline-flex items-center gap-2 font-bold text-green-700 group-hover:gap-3 transition-all">
                블로그 바로가기 <ArrowRight className="w-5 h-5" />
              </span>
            </div>
          </a>
        </section>
        </div>
      </div>
    </>
  );
}
