import type { MetadataRoute } from "next";

const SITE_URL = "https://withcom.co.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 검색 비노출 영역 (관리자·API·인증·개인·미리보기)
      disallow: ["/admin", "/api", "/auth", "/mypage", "/preview", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
