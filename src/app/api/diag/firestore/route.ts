/**
 * 임시 진단 라우트 — Firestore Admin 쓰기 실제 에러를 그대로 반환한다.
 * 원인 파악 후 삭제할 것. (App Hosting 런타임 로그를 CLI 로 못 보는 동안만 사용)
 */
import { NextResponse } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null;
  const hasExplicitCreds = Boolean(
    process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  try {
    const ref = await adminDb()
      .collection("_debug")
      .add({ at: FieldValue.serverTimestamp() });
    return NextResponse.json({
      ok: true,
      wrote: ref.id,
      projectId,
      credPath: hasExplicitCreds ? "cert" : "ADC",
    });
  } catch (e) {
    const err = e as { message?: string; code?: unknown; details?: unknown };
    return NextResponse.json(
      {
        ok: false,
        projectId,
        credPath: hasExplicitCreds ? "cert" : "ADC",
        error: err?.message ?? String(e),
        code: err?.code ?? null,
        details: err?.details ?? null,
      },
      { status: 500 },
    );
  }
}
