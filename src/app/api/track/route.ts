import { NextRequest, NextResponse } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";

export const runtime = "nodejs";

// 홈페이지 방문·콘텐츠 조회 집계 (자체 집계).
// 클라(<VisitTracker/>, trackContentView)가 sendBeacon 으로 호출.
// - 방문(pageview): siteVisits/{KST YYYY-MM-DD} 문서에 pageviews·uniques·paths 증가.
// - 콘텐츠(content): 해당 문서 viewCount 증가.
// 집계 실패/무효 요청도 항상 204 로 응답(클라는 응답을 읽지 않음).

const NO_CONTENT = new NextResponse(null, { status: 204 });

const CONTENT_COLLECTIONS: readonly string[] = [
  COLLECTIONS.CONTENTS,
  COLLECTIONS.AI_TOOLS,
  COLLECTIONS.SME_SUPPORT,
];

const BOT_RE =
  /bot|crawl|spider|slurp|bing|yandex|baidu|duckduck|facebookexternalhit|embedly|quora|pinterest|slackbot|telegrambot|whatsapp|semrush|ahrefs|mj12|dotbot|petalbot|headless|lighthouse|monitor|preview/i;

/** KST 기준 오늘 날짜 (YYYY-MM-DD) — 문서 id */
function kstDate(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** pathname 정제 (쿼리·해시 제거, 끝 슬래시 정리, 길이 제한) — 표시용 원본 */
function cleanPath(raw: unknown): string {
  let p = typeof raw === "string" ? raw : "/";
  p = p.split("?")[0].split("#")[0];
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1) p = p.replace(/\/+$/, ""); // 루트가 아니면 끝 슬래시 제거
  return p.slice(0, 100) || "/";
}

/** Firestore map key 로 안전한 키 (영숫자·_·- 만) — 슬래시 등 예약문자로 인한 쓰기 실패 방지 */
function safeKey(path: string): string {
  return path.replace(/[^A-Za-z0-9-]/g, "_").slice(0, 100) || "_";
}

export async function POST(req: NextRequest) {
  // 봇 트래픽 제외
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT_RE.test(ua)) return NO_CONTENT;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // sendBeacon 은 text/plain 로 보낼 수 있어 text 재파싱 시도
    try {
      body = JSON.parse(await req.text()) as Record<string, unknown>;
    } catch {
      return NO_CONTENT;
    }
  }

  try {
    if (body.kind === "content") {
      const collection = String(body.collection ?? "");
      const id = String(body.id ?? "");
      if (!CONTENT_COLLECTIONS.includes(collection) || !id || id.length > 200) {
        return NO_CONTENT;
      }
      // update: 문서가 있을 때만 증가(잘못된 id 로 빈 문서 생성 방지). 없으면 throw → 무시.
      await adminDb()
        .collection(collection)
        .doc(id)
        .update({ viewCount: FieldValue.increment(1) });
      return NO_CONTENT;
    }

    // 기본: 페이지뷰
    const path = cleanPath(body.path);
    const key = safeKey(path);
    const newToday = body.newToday === true;
    const date = kstDate();
    await adminDb()
      .collection(COLLECTIONS.SITE_VISITS)
      .doc(date)
      .set(
        {
          date,
          pageviews: FieldValue.increment(1),
          uniques: FieldValue.increment(newToday ? 1 : 0),
          paths: { [key]: FieldValue.increment(1) },
          pathLabels: { [key]: path },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    return NO_CONTENT;
  } catch {
    // 집계 실패는 조용히 무시
    return NO_CONTENT;
  }
}
