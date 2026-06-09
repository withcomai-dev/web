/** 임시 진단 — createCustomToken(ADC 서명) 동작 확인용. 검증 후 삭제. */
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const t = await adminAuth().createCustomToken("diag-test-uid", {
      role: "user",
    });
    return NextResponse.json({ ok: true, tokenLen: t.length });
  } catch (e) {
    const err = e as { message?: string; code?: unknown };
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(e), code: err?.code ?? null },
      { status: 500 },
    );
  }
}
