import { NextRequest, NextResponse } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { getIntegration } from "@/lib/integrations";

export const runtime = "nodejs";

/**
 * 매시간 호출되어 publishedAt이 과거이고 status가 draft인 콘텐츠를 published로 전환.
 * 외부 cron(Cloud Scheduler/Vercel Cron)이 호출하는 엔드포인트.
 *
 * 보안: cronSecret 헤더 또는 ?token= 검증 (어드민 통합 설정에서 입력).
 */
export async function GET(req: NextRequest) {
  const expected = await getIntegration("cronSecret");
  if (expected) {
    const token =
      req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("token");
    if (token !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const now = new Date().toISOString();
  let promoted = 0;

  try {
    // 콘텐츠
    const snap = await adminDb()
      .collection("contents")
      .where("status", "==", "draft")
      .where("publishedAt", "<=", now)
      .limit(50)
      .get();
    for (const d of snap.docs) {
      await d.ref.update({
        status: "published",
        updatedAt: FieldValue.serverTimestamp(),
      });
      promoted++;
    }
  } catch (e) {
    console.error("publish-scheduled 실패:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "fail" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, promoted, ranAt: now });
}
