import { COLLECTIONS, getCollection } from "@/lib/firestore";
import type { ContentDoc } from "@/types/cms";
import ContentDetailClient from "./ContentDetailClient";

// 빌드 시점에 발행된 콘텐츠 slug 를 정적 생성 (이후 새 글은 재배포 시 반영).
// output:export 는 빈 배열을 허용하지 않으므로, 비었을 땐 sentinel 1개를 둔다
// (클라이언트가 not-found 를 렌더 → 실제 콘텐츠가 생기면 재배포 시 채워진다).
export async function generateStaticParams() {
  try {
    const docs = await getCollection<ContentDoc>(COLLECTIONS.CONTENTS);
    const params = docs
      .filter((d) => d.status === "published" && !!d.slug)
      .map((d) => ({ slug: d.slug }));
    if (params.length > 0) return params;
  } catch {
    /* 빌드 시 Firestore 미연결 → sentinel 폴백 */
  }
  return [{ slug: "__none__" }];
}

export default async function ContentDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ContentDetailClient slug={slug} />;
}
