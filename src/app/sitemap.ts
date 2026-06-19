import type { MetadataRoute } from "next";

const SITE_URL = "https://withcom.co.kr";

/** 검색엔진에 노출할 주요 공개 페이지 */
const ROUTES = [
  "",
  "/about",
  "/notice",
  "/smartwork-ai",
  "/contents",
  "/youtube",
  "/it-service",
  "/ai-tools",
  "/sme-support",
  "/sme-support/small-business",
  "/sme-support/rnd",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
