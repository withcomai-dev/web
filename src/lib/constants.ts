import type { AiToolCategory } from "@/types/cms";

export const SITE_NAME = "WITHCOM AI";
export const SITE_TAGLINE = "중소기업의 스마트워크와 생성형 AI 활용을 지원하는 파트너";

export const COMPANY = {
  name: "WITHCOM AI",
  ceo: "유충식",
  bizNo: "118-81-21310",
  address: "서울특별시 동작구 여의대방로 28, 103동 903호 (신대방동, 현대아파트)",
  phone: "02-841-7241",
  email: "withcomai@gmail.com",
  shopUrl: "https://mall.withcom.co.kr",
  remoteSupportUrl: "http://15663669.co.kr/start",
  youtubeUrl:
    "https://www.youtube.com/@%EC%9C%84%EB%8D%94%EC%8A%A4%EC%BB%B4%ED%93%A8%ED%84%B0%EC%A3%BC",
  blogUrl: "https://blog.naver.com/withcom_ai",
};

/** AI TOOL 소개 게시판 카테고리 — 스마트워크&AI 페이지 6개 카드와 1:1 매핑 */
export const AI_TOOL_CATEGORIES: {
  slug: AiToolCategory;
  label: string;
  description: string;
}[] = [
  {
    slug: "ai-assistant",
    label: "생성형 AI 어시스턴트",
    description:
      "ChatGPT·Claude·Gemini 등으로 문서 작성, 요약, 번역, 아이디어 발굴을 자동화합니다.",
  },
  {
    slug: "collaboration",
    label: "협업·메신저 도구",
    description:
      "팀즈·슬랙·잔디 등 실시간 소통과 자료 공유로 회의·보고 시간을 줄입니다.",
  },
  {
    slug: "cloud-office",
    label: "클라우드 오피스",
    description:
      "구글 워크스페이스·M365로 언제 어디서나 문서를 함께 작성하고 관리합니다.",
  },
  {
    slug: "automation",
    label: "업무 자동화",
    description: "반복 입력·전송 업무를 자동화 도구로 연결해 사람의 실수를 줄입니다.",
  },
  {
    slug: "data-analysis",
    label: "데이터 정리·분석",
    description:
      "흩어진 자료를 한곳에 모으고, AI로 검색·분석 가능한 자산으로 만듭니다.",
  },
  {
    slug: "customer-ai",
    label: "고객 응대 AI",
    description: "챗봇·자동 응답으로 단순 문의를 처리하고 상담 품질을 높입니다.",
  },
];

export const AI_TOOL_CATEGORY_LABELS: Record<AiToolCategory, string> =
  Object.fromEntries(
    AI_TOOL_CATEGORIES.map((c) => [c.slug, c.label]),
  ) as Record<AiToolCategory, string>;

export type NavChild = { label: string; href: string; external?: boolean };
export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
  children?: NavChild[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "홈",
    href: "/",
    children: [
      { label: "회사 소개", href: "/about" },
      { label: "공지사항", href: "/notice" },
    ],
  },
  {
    label: "스마트워크 & AI",
    href: "/smartwork-ai",
    children: [
      { label: "AI TOOL 소개", href: "/smartwork-ai" },
      { label: "업무활용 콘텐츠", href: "/contents" },
      { label: "블로그 및 유튜브", href: "/youtube" },
    ],
  },
  {
    label: "IT 서비스",
    href: "/it-service",
    children: [
      { label: "하드웨어 및 소프트웨어 구축", href: "/it-service" },
      { label: "상담 신청하기", href: "/contact" },
      {
        label: "공식 쇼핑몰 바로가기",
        href: "https://mall.withcom.co.kr",
        external: true,
      },
    ],
  },
  {
    label: "중소기업 지원사업",
    href: "/sme-support",
    children: [
      { label: "소상공인 지원사업", href: "/sme-support/small-business" },
      { label: "R&D 지원사업", href: "/sme-support/rnd" },
    ],
  },
  {
    label: "고객 서비스",
    href: "/contact",
    children: [
      { label: "문의하기", href: "/contact" },
      {
        label: "원격지원 (위더스컴퓨터)",
        href: "http://15663669.co.kr/start",
        external: true,
      },
    ],
  },
];

export const ADMIN_NAV_ITEMS = [
  { label: "대시보드", href: "/admin", icon: "layout-dashboard" },
  { label: "페이지·섹션", href: "/admin/pages", icon: "layout" },
  { label: "공지사항", href: "/admin/notices", icon: "megaphone" },
  { label: "업무활용 콘텐츠", href: "/admin/contents", icon: "file-text" },
  { label: "AI TOOL 소개", href: "/admin/ai-tools", icon: "bot" },
  { label: "중소기업 지원", href: "/admin/sme-support", icon: "briefcase" },
  // 숨김 처리 (페이지는 유지 — 사이드바에만 미노출, 필요 시 주석 해제)
  // { label: "쇼핑몰(런모아)", href: "/admin/shop", icon: "shopping-bag" },
  { label: "배너", href: "/admin/banners", icon: "image" },
  { label: "문의", href: "/admin/inquiries", icon: "mail" },
  { label: "관리자 권한", href: "/admin/users", icon: "users" },
  { label: "회원", href: "/admin/members", icon: "user-check" },
  // { label: "도움말", href: "/admin/help", icon: "help-circle" },
  // { label: "버그 신고", href: "/admin/feedback", icon: "bug" },
  { label: "활동 로그", href: "/admin/audit", icon: "activity" },
  { label: "사이트 설정", href: "/admin/settings", icon: "settings" },
  { label: "외부 서비스 키", href: "/admin/integrations", icon: "key" },
];

export const RUNMOA_CONTENT_TYPE_LABELS: Record<string, string> = {
  vod: "VOD",
  live: "라이브",
  offline: "오프라인",
  digital_content: "디지털 콘텐츠",
};

export const RUNMOA_STATUS_LABELS: Record<string, string> = {
  publish: "판매중",
  pending: "숨김",
  paused: "판매중지",
  in_review: "검토중",
  banned: "판매불가",
};

export const RUNMOA_STATUS_COLORS: Record<string, string> = {
  publish: "bg-green-100 text-green-700",
  pending: "bg-gray-100 text-gray-600",
  paused: "bg-yellow-100 text-yellow-700",
  in_review: "bg-blue-100 text-blue-700",
  banned: "bg-red-100 text-red-700",
};

export const HELP_CATEGORIES = [
  "사이트 이용",
  "회원·로그인",
  "쇼핑몰",
  "문의·상담",
  "기타",
];

export const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  open: "신규",
  in_progress: "처리중",
  closed: "처리완료",
};

export const FEEDBACK_STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  closed: "bg-gray-100 text-gray-600",
};

export const SME_CATEGORY_LABELS: Record<string, string> = {
  "small-business": "소상공인 지원사업",
  rnd: "R&D 지원사업",
};

export const SME_CATEGORY_ORDER: ("small-business" | "rnd")[] = [
  "small-business",
  "rnd",
];

export const INQUIRY_TYPES = [
  "스마트워크 도입",
  "AI 컨설팅",
  "IT 인프라 구축",
  "원격지원",
  "쇼핑몰 문의",
  "기타",
];
