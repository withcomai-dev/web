import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ⚠️ 정적 export 제거: /auth/callback 라우트 핸들러(서버)에서 client_secret 으로
  //    토큰을 교환하려면 서버 런타임이 필요하다. (Cloud Run/Vercel 등 SSR 호스트에 배포)
  reactStrictMode: true,
  images: {
    // 이미지 최적화 서버 의존을 피해 원본 그대로 사용 (배포 단순화)
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
