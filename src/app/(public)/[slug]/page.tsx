import { notFound } from "next/navigation";
import {
  COLLECTIONS,
  PAGE_DOC_ID,
  getSingletonDoc,
} from "@/lib/firestore";
import SectionRenderer from "@/components/sections/SectionRenderer";
import type { PageDoc, PageRegistry } from "@/types/cms";

export const dynamic = "force-dynamic";

const REGISTRY_DOC_ID = "pageRegistry";

const HARD_RESERVED = new Set([
  "about",
  "smartwork-ai",
  "it-service",
  "sme-support",
  "contact",
  "contents",
  "shop",
  "youtube",
  "help",
  "login",
  "admin",
  "preview",
  "api",
]);

async function findPageBySlug(slug: string): Promise<PageDoc | null> {
  const reg = await getSingletonDoc<PageRegistry>(
    COLLECTIONS.SETTINGS,
    REGISTRY_DOC_ID,
  );
  if (!reg || !Array.isArray(reg.pages)) return null;
  const norm = "/" + slug;
  const entry = reg.pages.find((p) => p.slug === norm);
  if (!entry) return null;
  const page = await getSingletonDoc<PageDoc>(
    COLLECTIONS.SETTINGS,
    PAGE_DOC_ID(entry.key),
  );
  return page;
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // 정적 라우트와 충돌 방지 (Next.js가 자동 처리하지만 안전망)
  if (HARD_RESERVED.has(slug)) notFound();
  const page = await findPageBySlug(slug);
  if (!page || !page.sections || page.sections.length === 0) notFound();
  return <SectionRenderer sections={page.sections} />;
}
