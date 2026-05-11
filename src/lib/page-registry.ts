"use client";

import {
  COLLECTIONS,
  getSingletonDoc,
  setSingletonDoc,
  removeDoc,
  invalidateCache,
} from "@/lib/firestore";
import type { PageRegistry, PageRegistryEntry } from "@/types/cms";

const REGISTRY_DOC_ID = "pageRegistry";

/** 시스템 내장 페이지 — 항상 존재하며 삭제·키 변경 불가. 제목은 변경 가능. */
export const BUILT_IN_PAGES: PageRegistryEntry[] = [
  { key: "home", title: "홈", slug: "/", isBuiltIn: true, order: 1 },
  { key: "about", title: "회사 소개", slug: "/about", isBuiltIn: true, order: 2 },
  { key: "smartwork-ai", title: "스마트워크 & AI", slug: "/smartwork-ai", isBuiltIn: true, order: 3 },
  { key: "it-service", title: "IT 서비스", slug: "/it-service", isBuiltIn: true, order: 4 },
  { key: "sme-support", title: "중소기업 지원사업", slug: "/sme-support", isBuiltIn: true, order: 5 },
  { key: "contact", title: "문의하기", slug: "/contact", isBuiltIn: true, order: 6 },
];

const RESERVED_SLUGS = new Set([
  "/",
  "/about",
  "/smartwork-ai",
  "/it-service",
  "/sme-support",
  "/contact",
  "/contents",
  "/shop",
  "/youtube",
  "/help",
  "/login",
  "/admin",
  "/preview",
  "/api",
]);

/** 슬러그 정규화 — 앞에 / 보장, 뒤 / 제거, 공백·특수문자 정리 */
export function normalizeSlug(input: string): string {
  let s = input.trim().toLowerCase();
  if (!s.startsWith("/")) s = "/" + s;
  s = s.replace(/\s+/g, "-").replace(/\/+$/g, "");
  if (s === "") s = "/";
  return s;
}

/** key 유효성 — 영문 소문자·숫자·하이픈만, 1자 이상 */
export function isValidKey(key: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,40}$/.test(key);
}

/** 슬러그가 예약어와 충돌하지 않는지 (커스텀 페이지 생성 시 검증) */
export function isReservedSlug(slug: string): boolean {
  const norm = normalizeSlug(slug);
  for (const r of RESERVED_SLUGS) {
    if (norm === r || norm.startsWith(r + "/")) return true;
  }
  return false;
}

/**
 * 등록된 페이지 목록을 반환. 내장 + Firestore 커스텀 머지.
 * 같은 key가 있으면 Firestore 값(제목 변경분 등)이 우선.
 */
export async function loadRegistry(): Promise<PageRegistryEntry[]> {
  let custom: PageRegistryEntry[] = [];
  try {
    const remote = await getSingletonDoc<PageRegistry>(
      COLLECTIONS.SETTINGS,
      REGISTRY_DOC_ID,
    );
    if (remote && Array.isArray(remote.pages)) {
      custom = remote.pages;
    }
  } catch {
    // ignore — fall back to built-ins only
  }

  const customByKey = new Map(custom.map((p) => [p.key, p]));
  const merged = BUILT_IN_PAGES.map((b) => {
    const override = customByKey.get(b.key);
    return override
      ? { ...b, title: override.title, order: override.order ?? b.order }
      : b;
  });

  for (const c of custom) {
    if (!BUILT_IN_PAGES.some((b) => b.key === c.key)) {
      merged.push({ ...c, isBuiltIn: false });
    }
  }

  merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return merged;
}

/** Firestore에 전체 레지스트리를 저장 (내장 페이지의 제목 변경분도 포함) */
export async function saveRegistry(pages: PageRegistryEntry[]): Promise<void> {
  await setSingletonDoc(COLLECTIONS.SETTINGS, REGISTRY_DOC_ID, {
    pages,
  });
  invalidateCache(COLLECTIONS.SETTINGS);
}

export async function addPage(entry: {
  key: string;
  title: string;
  slug: string;
}): Promise<void> {
  if (!isValidKey(entry.key)) {
    throw new Error("키는 영문 소문자·숫자·하이픈만 가능합니다.");
  }
  const slug = normalizeSlug(entry.slug);
  if (isReservedSlug(slug)) {
    throw new Error(`슬러그 '${slug}'는 시스템 예약어입니다.`);
  }
  const all = await loadRegistry();
  if (all.some((p) => p.key === entry.key)) {
    throw new Error(`이미 같은 키의 페이지가 있습니다: ${entry.key}`);
  }
  if (all.some((p) => p.slug === slug)) {
    throw new Error(`이미 같은 슬러그의 페이지가 있습니다: ${slug}`);
  }
  const order = Math.max(...all.map((p) => p.order ?? 0), 0) + 1;
  const next = [...all, { key: entry.key, title: entry.title, slug, isBuiltIn: false, order }];
  await saveRegistry(next.filter((p) => !p.isBuiltIn || customNeedsSync(p)));
}

/** 내장 페이지에서 제목·order가 기본값과 다르면 Firestore에 보존해야 함 */
function customNeedsSync(p: PageRegistryEntry): boolean {
  const builtIn = BUILT_IN_PAGES.find((b) => b.key === p.key);
  if (!builtIn) return true;
  return builtIn.title !== p.title || builtIn.order !== p.order;
}

export async function renamePage(key: string, newTitle: string, newSlug?: string): Promise<void> {
  const all = await loadRegistry();
  const idx = all.findIndex((p) => p.key === key);
  if (idx < 0) throw new Error("페이지를 찾을 수 없습니다.");

  const target = all[idx];
  let slug = target.slug;
  if (newSlug !== undefined && !target.isBuiltIn) {
    const n = normalizeSlug(newSlug);
    if (isReservedSlug(n) && n !== target.slug) {
      throw new Error(`슬러그 '${n}'는 시스템 예약어입니다.`);
    }
    if (all.some((p) => p.key !== key && p.slug === n)) {
      throw new Error(`이미 같은 슬러그가 있습니다: ${n}`);
    }
    slug = n;
  }
  all[idx] = { ...target, title: newTitle, slug };
  await saveRegistry(all.filter((p) => !p.isBuiltIn || customNeedsSync(p)));
}

export async function deletePage(key: string): Promise<void> {
  const all = await loadRegistry();
  const target = all.find((p) => p.key === key);
  if (!target) throw new Error("페이지를 찾을 수 없습니다.");
  if (target.isBuiltIn) throw new Error("내장 페이지는 삭제할 수 없습니다.");
  const next = all.filter((p) => p.key !== key);
  await saveRegistry(next.filter((p) => !p.isBuiltIn || customNeedsSync(p)));
  // 페이지 본문 문서도 삭제 (siteSettings/page_<key>)
  try {
    await removeDoc(COLLECTIONS.SETTINGS, `page_${key}`);
  } catch {
    // ignore — 데이터가 없거나 룰 거부
  }
}

export async function reorderPages(orderedKeys: string[]): Promise<void> {
  const all = await loadRegistry();
  const next = orderedKeys
    .map((k, i) => {
      const p = all.find((x) => x.key === k);
      return p ? { ...p, order: i + 1 } : null;
    })
    .filter((x): x is PageRegistryEntry => !!x);
  await saveRegistry(next.filter((p) => !p.isBuiltIn || customNeedsSync(p)));
}
