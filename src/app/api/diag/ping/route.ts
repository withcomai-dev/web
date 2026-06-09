/** 임시 배포 버전 마커 — 실제 서빙 버전 확인용. 검증 후 삭제. */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ version: "authdone-cardless-2026-06-09" });
}
