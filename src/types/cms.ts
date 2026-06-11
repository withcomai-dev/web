// ── 페이지·섹션 CMS 타입 ──

export type SectionType =
  | "hero"
  | "cards"
  | "feature"
  | "richtext"
  | "cta"
  | "image"
  | "blog"
  | "services"
  | "contact"
  | "sme";

export interface HeroData {
  bgImage?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctas?: { label: string; href: string; variant?: "primary" | "ghost" }[];
  /** 레이아웃 변형: fullscreen(기본, 전체 화면) | banner(배경 이미지를 컨테이너 폭 배너로 노출) */
  variant?: "fullscreen" | "banner";
}

export interface CardItem {
  icon?: string;
  title: string;
  body: string;
  /** 카드 클릭 시 이동할 링크 (선택 — 없으면 클릭 불가 카드) */
  href?: string;
}

export interface CardsData {
  eyebrow?: string;
  title?: string;
  description?: string;
  items: CardItem[];
  columns?: 2 | 3 | 4;
  /** 디자인 변형: default(밝은 카드) | highlight(다크 네이비 + 번호형 강조 카드) */
  variant?: "default" | "highlight";
}

export interface FeatureData {
  eyebrow?: string;
  title: string;
  image?: string;
  side?: "left" | "right";
  items: CardItem[];
}

export interface RichTextData {
  html: string;
}

export interface CTAData {
  bg?: "blue" | "slate" | "white";
  title: string;
  body?: string;
  button: { label: string; href: string };
}

export interface ImageBlockData {
  src: string;
  alt: string;
  caption?: string;
  href?: string;
}

export interface BlogPostItem {
  category: string;
  date: string;
  title: string;
  summary: string;
  thumbnail: string;
  href?: string;
}

export interface BlogData {
  eyebrow?: string;
  title: string;
  viewAllHref?: string;
  /** auto(기본): [콘텐츠] 메뉴 최신 게시글 자동 표시 · manual: items 직접 구성 */
  source?: "auto" | "manual";
  items: BlogPostItem[];
}

export interface ServiceLinkItem {
  icon: string;
  title: string;
  body: string;
  href: string;
  external?: boolean;
  bg: "blue" | "slate" | "rose" | "emerald";
  ctaLabel?: string;
}

export interface ServicesData {
  items: ServiceLinkItem[];
}

export interface ContactSectionData {
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  /** 섹션 하단에 공개 문의 내역 리스트 노출 여부 (이름 마스킹·내용 비공개) */
  showList?: boolean;
}

/** 중소기업 지원사업 목록 섹션 (Firestore smeSupport 컬렉션을 카테고리별로 노출) */
export interface SmeSectionData {
  eyebrow?: string;
  heading?: string;
  description?: string;
  /** 특정 카테고리만 노출 (미지정 시 전체 카테고리) */
  category?: SmeCategory;
  /** 카테고리별 최대 노출 개수 (요약 노출용). 미지정 시 전체 */
  limitPerCategory?: number;
  /** 전체 보기 링크(/sme-support) 노출 여부 */
  showViewAll?: boolean;
  /** 등록 항목이 없을 때 섹션 자체를 숨길지 여부 (기본 false = 항상 노출) */
  hideWhenEmpty?: boolean;
}

export type SectionData =
  | { type: "hero"; data: HeroData }
  | { type: "cards"; data: CardsData }
  | { type: "feature"; data: FeatureData }
  | { type: "richtext"; data: RichTextData }
  | { type: "cta"; data: CTAData }
  | { type: "image"; data: ImageBlockData }
  | { type: "blog"; data: BlogData }
  | { type: "services"; data: ServicesData }
  | { type: "contact"; data: ContactSectionData }
  | { type: "sme"; data: SmeSectionData };

export interface Section {
  id: string;
  order: number;
  visible: boolean;
  type: SectionType;
  data:
    | HeroData
    | CardsData
    | FeatureData
    | RichTextData
    | CTAData
    | ImageBlockData
    | BlogData
    | ServicesData
    | ContactSectionData
    | SmeSectionData;
}

export interface PageDoc {
  id?: string;
  key: string;
  title: string;
  sections: Section[];
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  updatedAt?: string;
}

/** 등록된 페이지 메타. 갑이 어드민에서 신규 페이지를 추가·삭제·이름변경할 수 있도록 한다. */
export interface PageRegistryEntry {
  /** 고유 식별자. siteSettings/page_<key> 문서 ID로 사용. */
  key: string;
  /** 어드민 탭에 보일 이름 */
  title: string;
  /** 공개 URL 경로. 내장 페이지는 고정, 커스텀은 사용자 입력 */
  slug: string;
  /** 내장 페이지 (삭제·이름변경 제한) */
  isBuiltIn?: boolean;
  /** 어드민 탭 순서 */
  order: number;
}

export interface PageRegistry {
  id?: string;
  pages: PageRegistryEntry[];
  updatedAt?: string;
}

export interface GlobalSettings {
  id?: string;
  logoUrl?: string;
  navItems?: {
    label: string;
    href: string;
    external?: boolean;
    children?: { label: string; href: string; external?: boolean }[];
  }[];
  footerText?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  sideTalkScriptId?: string;
  sideTalkExpiresAt?: string;
  socialLinks?: { type: string; url: string }[];
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
  designTokens?: {
    primaryColor?: string;
    primaryDarkColor?: string;
    fontFamily?: string;
  };
}

// ── 사용자 ──
export type UserRole = "user" | "admin" | "superadmin";
export type UserStatus = "active" | "suspended";

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  lastLoginAt?: string;
  /** 관리자 메모 (관리자만 작성·열람) */
  adminNote?: string;
}

// ── 콘텐츠 (블로그형 게시판) ──
export type ContentStatus = "draft" | "published";

export interface ContentDoc {
  id?: string;
  title: string;
  slug: string;
  category: string;
  thumbnail?: string;
  bodyHtml: string;
  summary?: string;
  tags?: string[];
  publishedAt?: string;
  status: ContentStatus;
  viewCount?: number;
  authorEmail?: string;
  /** 항상 노출(고정) — 홈·목록에서 최신글보다 우선 표시 */
  pinned?: boolean;
}

// ── AI TOOL 소개 게시판 (스마트워크&AI 페이지 6개 카드와 연결) ──
export type AiToolCategory =
  | "ai-assistant"
  | "collaboration"
  | "cloud-office"
  | "automation"
  | "data-analysis"
  | "customer-ai";

export interface AiToolDoc {
  id?: string;
  category: AiToolCategory;
  title: string;
  slug: string;
  thumbnail?: string;
  bodyHtml: string;
  summary?: string;
  publishedAt?: string;
  status: ContentStatus;
  viewCount?: number;
  authorEmail?: string;
}

// ── 공지사항 (작성은 어드민에서만 — firestore.rules write isAdmin) ──
export interface NoticeDoc {
  id?: string;
  title: string;
  bodyHtml: string;
  /** 중요 공지 — 목록 상단 고정 */
  pinned?: boolean;
  publishedAt?: string;
  status: ContentStatus; // published=노출 / draft=숨김
  createdAt?: string;
  updatedAt?: string;
}

// ── 중소기업 지원사업 ──
export type SmeCategory = "small-business" | "rnd";

export interface SmeSupportDoc {
  id?: string;
  category?: SmeCategory; // 소상공인지원사업 / R&D지원사업
  title: string;
  agency?: string;
  deadline?: string;
  summary?: string;
  bodyHtml: string;
  applyUrl?: string;
  thumbnail?: string;
  sortOrder?: number; // 정렬 순서 (작을수록 먼저)
  status: ContentStatus; // 노출 여부 (published=노출, draft=숨김)
}

// ── 도움말 ──
export type HelpAudience = "public" | "admin" | "both";

export interface HelpDoc {
  id?: string;
  category: string;
  title: string;
  slug: string;
  thumbnail?: string;
  bodyHtml: string;
  audience: HelpAudience;
  order: number;
  status: ContentStatus;
  viewCount?: number;
  updatedAt?: string;
}

export interface HelpQuestion {
  id?: string;
  question: string;
  askerUid?: string;
  askerEmail?: string;
  pageUrl?: string;
  answer?: string;
  answeredAt?: string;
  answererEmail?: string;
  status: "open" | "answered" | "closed";
  createdAt?: string;
}

// ── 배너 ──
export interface BannerDoc {
  id?: string;
  title: string;
  imageUrl: string;
  link?: string;
  order: number;
  visible: boolean;
  startAt?: string;
  endAt?: string;
}

// ── 문의 ──
export type InquiryStatus = "new" | "in_progress" | "answered" | "closed";

export interface InquiryDoc {
  id?: string;
  type: string;
  name: string;
  company?: string;
  phone?: string;
  email: string;
  message: string;
  attachments?: string[];
  sheetSyncedAt?: string;
  status: InquiryStatus;
  createdAt?: string;
  note?: string;
  /** 제출한 로그인 회원의 Firebase UID (문의 제출 로그인 필수화 이후 기록) */
  submitterUid?: string;
}

// ── 런모아 로그인 회원 ──
// 런모아 호스티드 로그인으로 들어온 사용자를 기록한다(서버 Admin SDK 전용 쓰기).
// 문서 ID = 런모아 user_id (재로그인 시 자동 갱신·로그인 횟수 누적).
// ⚠️ CMS 관리자 계정인 `users` 컬렉션과는 전혀 별개의 신원이다.
export interface RunmoaMemberDoc {
  id?: string;
  runmoaUserId: number;
  loginId: string;
  name: string;
  email: string;
  phone?: string | null;
  socialChannel?: string | null;
  marketingAgree?: string | null;
  firstLoginAt?: string;
  lastLoginAt?: string;
  loginCount?: number;
  updatedAt?: string;
}

// ── 버그 신고 ──
export type FeedbackStatus = "open" | "in_progress" | "closed";

export interface ConsoleErrorEntry {
  message: string;
  source?: string;
  line?: number;
  col?: number;
  stack?: string;
  at: string;
}

export interface NetworkErrorEntry {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  at: string;
}

export interface FeedbackContext {
  url: string;
  pathname: string;
  search?: string;
  hash?: string;
  routeFile?: string;
  userAgent: string;
  viewport: { w: number; h: number };
  language: string;
  consoleErrors: ConsoleErrorEntry[];
  networkErrors: NetworkErrorEntry[];
}

export interface FeedbackReport {
  id?: string;
  message: string;
  context: FeedbackContext;
  screenshotUrl: string;
  domSnapshot: string;
  reporterUid?: string;
  reporterEmail?: string;
  status: FeedbackStatus;
  createdAt: string;
  assignee?: string;
  resolution?: string;
}
