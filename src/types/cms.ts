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
  | "contact";

export interface HeroData {
  bgImage?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctas?: { label: string; href: string; variant?: "primary" | "ghost" }[];
}

export interface CardItem {
  icon?: string;
  title: string;
  body: string;
}

export interface CardsData {
  eyebrow?: string;
  title?: string;
  description?: string;
  items: CardItem[];
  columns?: 2 | 3 | 4;
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
  | { type: "contact"; data: ContactSectionData };

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
    | ContactSectionData;
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

export interface GlobalSettings {
  id?: string;
  logoUrl?: string;
  navItems?: { label: string; href: string }[];
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
}

// ── 중소기업 지원사업 ──
export interface SmeSupportDoc {
  id?: string;
  title: string;
  agency?: string;
  deadline?: string;
  summary?: string;
  bodyHtml: string;
  applyUrl?: string;
  status: ContentStatus;
}

// ── 도움말 ──
export type HelpAudience = "public" | "admin" | "both";

export interface HelpDoc {
  id?: string;
  category: string;
  title: string;
  slug: string;
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
