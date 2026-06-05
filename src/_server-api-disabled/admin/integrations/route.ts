import { NextRequest, NextResponse } from "next/server";
import {
  getIntegrationsStatus,
  setIntegrations,
  ALL_INTEGRATION_KEYS,
  type IntegrationKey,
} from "@/lib/integrations";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";

/** GET — 어떤 키가 설정됐는지 (값은 마스킹) */
export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const status = await getIntegrationsStatus();
    return NextResponse.json({ status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
      { status: 500 },
    );
  }
}

/** PATCH — 일부 키 갱신. 빈 문자열 = 삭제(env fallback 복귀) */
export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAdmin(req);
  if (errorResponse) return errorResponse;

  let body: Partial<Record<IntegrationKey, string>>;
  try {
    body = (await req.json()) as Partial<Record<IntegrationKey, string>>;
  } catch {
    return NextResponse.json({ error: "잘못된 본문" }, { status: 400 });
  }

  const validKeys = new Set(ALL_INTEGRATION_KEYS);
  const filtered: Partial<Record<IntegrationKey, string>> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!validKeys.has(k as IntegrationKey)) continue;
    if (typeof v !== "string") continue;
    filtered[k as IntegrationKey] = v;
  }
  if (Object.keys(filtered).length === 0) {
    return NextResponse.json({ error: "갱신할 키가 없습니다." }, { status: 400 });
  }

  try {
    await setIntegrations(filtered);
    const status = await getIntegrationsStatus();
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "저장 실패" },
      { status: 500 },
    );
  }
}
