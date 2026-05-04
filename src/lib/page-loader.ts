import { COLLECTIONS, PAGE_DOC_ID, getSingletonDoc } from "@/lib/firestore";
import type { PageDoc } from "@/types/cms";
import { ALL_PAGE_SEEDS } from "@/lib/seed-data";

/** 페이지 데이터를 Firestore에서 로드하고, 없으면 시드 데이터로 폴백한다. */
export async function loadPage(key: string): Promise<PageDoc | null> {
  try {
    const remote = await getSingletonDoc<PageDoc>(
      COLLECTIONS.SETTINGS,
      PAGE_DOC_ID(key),
    );
    if (remote && remote.sections && remote.sections.length > 0) {
      return remote;
    }
  } catch {
    // Firebase 미초기화·룰 거부 등 → 시드 폴백
  }
  const seed = ALL_PAGE_SEEDS.find((p) => p.key === key);
  return seed ?? null;
}
