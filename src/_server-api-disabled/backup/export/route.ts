import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const COLLECTIONS_TO_BACKUP = [
  "users",
  "siteSettings",
  "contents",
  "smeSupport",
  "helpDocs",
  "helpQuestions",
  "banners",
  "inquiries",
  "feedbackReports",
];

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdmin(req);
  if (errorResponse) return errorResponse;

  const dump: Record<string, unknown[]> = {};
  for (const col of COLLECTIONS_TO_BACKUP) {
    try {
      const snap = await adminDb().collection(col).get();
      dump[col] = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
    } catch {
      dump[col] = [];
    }
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    collections: dump,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="withcom-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
