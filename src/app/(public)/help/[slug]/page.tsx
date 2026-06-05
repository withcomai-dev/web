import { COLLECTIONS, getCollection } from "@/lib/firestore";
import type { HelpDoc } from "@/types/cms";
import HelpDetailClient from "./HelpDetailClient";

// 빌드 시점에 발행된 도움말 slug 를 정적 생성 (이후 새 글은 재배포 시 반영)
export async function generateStaticParams() {
  try {
    const docs = await getCollection<HelpDoc>(COLLECTIONS.HELP_DOCS);
    const params = docs
      .filter((d) => d.status === "published" && !!d.slug)
      .map((d) => ({ slug: d.slug }));
    if (params.length > 0) return params;
  } catch {
    /* 빌드 시 Firestore 미연결 → sentinel 폴백 */
  }
  // output:export 는 빈 배열을 허용하지 않으므로 sentinel 1개 (클라이언트가 not-found 렌더)
  return [{ slug: "__none__" }];
}

export default async function HelpDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <HelpDetailClient slug={slug} />;
}
