import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 export (무료 Firebase Hosting 배포용) — 서버/SSR 없이 out/ 정적 파일 생성
  output: "export",
  reactStrictMode: true,
  images: {
    // 정적 export 에는 이미지 최적화 서버가 없으므로 비활성화 (원본 그대로 사용)
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "withcomai-web.firebasestorage.app" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "aish.runmoa.com" },
    ],
  },
};

export default nextConfig;
