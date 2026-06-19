import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import DevBypassBanner from "@/components/DevBypassBanner";
import { SITE_NAME, COMPANY } from "@/lib/constants";

/** 사이트 공식 도메인 — OG/canonical 절대경로 기준 */
const SITE_URL = "https://withcom.co.kr";

/** 검색엔진 소유확인 코드 (Google Search Console / 네이버 서치어드바이저) */
const GOOGLE_SITE_VERIFICATION = "OojlUOJgtLlh5X5fAj73rayfTIMgNO9giT6HNIUhmKI";
const NAVER_SITE_VERIFICATION = "d4f51386e3b6822b581cc5b758fe0472909ce711";

// 검색엔진/공유 메타 — 위드컴정보 요청 사양(노션 20260618)에 맞춘 확정 문구
const META_TITLE = "WITHCOM AI - 스마트워크 & 생성형 AI 비즈니스 솔루션";
const SITE_DESCRIPTION =
  "WITHCOM AI는 스마트워크 및 생성형 AI 정보 제공, 비즈니스 자동화 프로그램, IT 시스템 개발 및 공급, 웹사이트 제작 전문 기업입니다.";
const SHARE_DESCRIPTION =
  "스마트워크 & 생성형 AI 정보 제공 및 비즈니스 솔루션, 맞춤형 IT 시스템 개발 전문 기업 WITHCOM AI입니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: META_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI 솔루션",
    "스마트워크",
    "생성형AI",
    "IT시스템개발",
    "비즈니스자동화",
    "웹사이트제작",
    "소프트웨어공급",
    "AI PC",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_NAME,
    description: SHARE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/withcomai_01_color.png", alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SHARE_DESCRIPTION,
    images: ["/withcomai_01_color.png"],
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
    other: { "naver-site-verification": NAVER_SITE_VERIFICATION },
  },
};

/** 검색엔진 구조화 데이터 (schema.org Organization) */
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "위드컴정보",
  url: SITE_URL,
  logo: `${SITE_URL}/withcomai_01_color.png`,
  description: SITE_DESCRIPTION,
  email: COMPANY.email,
  telephone: COMPANY.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY.address,
    addressLocality: "동작구",
    addressRegion: "서울특별시",
    addressCountry: "KR",
  },
  sameAs: [COMPANY.blogUrl, COMPANY.youtubeUrl, "https://withuspc.com"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
      </head>
      <body className="bg-white text-slate-900 antialiased">
        <DevBypassBanner />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
