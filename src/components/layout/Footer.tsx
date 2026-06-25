import Link from "next/link";
import { COMPANY, NAV_ITEMS, SITE_NAME } from "@/lib/constants";
import FooterAuthLink from "@/components/layout/FooterAuthLink";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-16 border-t border-white/5">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Link href="/" aria-label="WITHCOM AI 홈페이지">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/withcomai_footer.png"
                  alt="WITHCOM AI"
                  className="h-[34px] w-auto"
                />
              </Link>
            </div>
            <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
              우리는 중소기업이 디지털 시대의 변화에 발맞춰 성장할 수 있도록 돕는 든든한 IT
              파트너입니다.
            </p>
            <div className="text-sm text-gray-400 space-y-1">
              <p>대표 {COMPANY.ceo} | 사업자등록번호 {COMPANY.bizNo}</p>
              <p>이메일 {COMPANY.email}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-6">바로가기</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              {NAV_ITEMS.slice(0, 5).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-blue-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors">
                  회사 소개
                </Link>
              </li>
              <li>
                <Link href="/notice" className="hover:text-blue-400 transition-colors">
                  공지사항
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-6">서비스</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <a
                  href={COMPANY.shopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400"
                >
                  공식 쇼핑몰
                </a>
              </li>
              <li>
                <a
                  href={COMPANY.remoteSupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400"
                >
                  원격지원
                </a>
              </li>
              <li>
                <a
                  href={COMPANY.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400"
                >
                  유튜브
                </a>
              </li>
              <li>
                <a
                  href={COMPANY.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400"
                >
                  블로그
                </a>
              </li>
              {/* 도움말 임시 숨김 — 필요 시 주석 해제
              <li>
                <Link href="/help" className="hover:text-blue-400">
                  도움말
                </Link>
              </li>
              */}
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© 1999 {SITE_NAME}. All rights reserved.</p>
          <div className="flex gap-6">
            {/* <Link href="/help" className="hover:text-gray-300">도움말</Link> */}
            <Link href="/contact" className="hover:text-gray-300">문의</Link>
            <FooterAuthLink />
          </div>
        </div>
      </div>
    </footer>
  );
}
