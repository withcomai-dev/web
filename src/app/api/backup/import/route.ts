import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

interface BackupPayload {
  exportedAt?: string;
  version?: number;
  collections: Record<string, Array<Record<string, unknown> & { _id?: string }>>;
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin(req);
  if (errorResponse) return errorResponse;

  let body: BackupPayload;
  try {
    body = (await req.json()) as BackupPayload;
  } catch {
    return NextResponse.json({ error: "잘못된 JSON" }, { status: 400 });
  }
  if (!body.collections) {
    return NextResponse.json({ error: "collections 필드 필요" }, { status: 400 });
  }

  const stats: Record<string, number> = {};
  for (const [colName, docs] of Object.entries(body.collections)) {
    if (!Array.isArray(docs)) continue;
    let count = 0;
    for (const d of docs) {
      const { _id, ...data } = d;
      const ref = _id
        ? adminDb().collection(colName).doc(_id)
        : adminDb().collection(colName).doc();
      try {
        await ref.set(data, { merge: true });
        count++;
      } catch (e) {
        console.error(`복원 실패 ${colName}/${_id}:`, e);
      }
    }
    stats[colName] = count;
  }

  return NextResponse.json({ ok: true, restored: stats });
}
