import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 공개 노출 가능한 최대 행 수 */
const LIST_LIMIT = 10;

/** 이름 마스킹: 1자 → "○*", 2자 → "홍*", 3자 이상 → "홍*동" */
function maskName(raw: unknown): string {
  const name = typeof raw === "string" ? raw.trim() : "";
  if (name.length === 0) return "익명";
  if (name.length === 1) return `${name}*`;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
}

/** Firestore Timestamp · ISO 문자열 모두 ISO 문자열로 정규화 */
function toIso(v: unknown): string {
  if (typeof v === "string") return v;
  if (
    v &&
    typeof v === "object" &&
    "toDate" in v &&
    typeof (v as { toDate: () => Date }).toDate === "function"
  ) {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

/**
 * 공개 문의 내역 — 개인정보 보호를 위해 유형·마스킹된 이름·접수일·답변 여부만 반환.
 * name 원문·이메일·전화·회사·문의 내용은 절대 포함하지 않는다.
 * (firestore.rules의 inquiries read:isAdmin은 그대로 유지 — 서버 Admin SDK로만 읽는다)
 */
export async function GET() {
  try {
    const snap = await adminDb()
      .collection(COLLECTIONS.INQUIRIES)
      .orderBy("createdAt", "desc")
      .limit(LIST_LIMIT)
      .get();

    const items = snap.docs.map((doc) => {
      const v = doc.data();
      return {
        type: typeof v.type === "string" && v.type ? v.type : "기타",
        maskedName: maskName(v.name),
        createdAt: toIso(v.createdAt),
        answered: v.status === "answered" || v.status === "closed",
      };
    });

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("공개 문의 목록 조회 실패:", e);
    return NextResponse.json(
      { error: "문의 내역을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
