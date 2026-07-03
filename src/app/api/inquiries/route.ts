import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { appendInquiryRow } from "@/lib/sheets";
import { COLLECTIONS } from "@/lib/firestore";
import { sendMail, inquiryNotifyTemplate } from "@/lib/mail";
import { getIntegration } from "@/lib/integrations";
import type { InquiryDoc } from "@/types/cms";

export const runtime = "nodejs";

interface InquiryBody {
  type?: string;
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  message?: string;
  attachments?: string[];
}

/** 문의 제출은 로그인 사용자만 허용 — Bearer ID 토큰 검증 (역할 불문) */
async function requireLogin(
  req: NextRequest,
): Promise<{ uid: string | null; errorResponse: NextResponse | null }> {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return { uid: "dev-bypass-uid", errorResponse: null };
  }
  const m = (req.headers.get("authorization") ?? "").match(/^Bearer (.+)$/);
  if (!m) {
    return {
      uid: null,
      errorResponse: NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      ),
    };
  }
  try {
    const decoded = await getAuth().verifyIdToken(m[1]);
    return { uid: decoded.uid, errorResponse: null };
  } catch {
    return {
      uid: null,
      errorResponse: NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      ),
    };
  }
}

export async function POST(req: NextRequest) {
  const { uid, errorResponse } = await requireLogin(req);
  if (errorResponse) return errorResponse;

  let body: InquiryBody;
  try {
    body = (await req.json()) as InquiryBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }

  const type = (body.type ?? "").trim();
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "성함·이메일·문의 내용은 필수입니다." },
      { status: 400 },
    );
  }
  if (message.length > 9999) {
    return NextResponse.json({ error: "문의 내용이 너무 깁니다." }, { status: 400 });
  }
  if (!/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: "유효한 이메일이 필요합니다." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const company = (body.company ?? "").trim();
  const phone = (body.phone ?? "").trim();

  const attachments = Array.isArray(body.attachments)
    ? body.attachments.filter((u) => typeof u === "string" && u.startsWith("https://")).slice(0, 5)
    : undefined;

  const inquiry: Omit<InquiryDoc, "id"> = {
    type: type || "기타",
    name,
    company: company || undefined,
    phone: phone || undefined,
    email,
    message,
    attachments,
    status: "new",
    createdAt,
    submitterUid: uid ?? undefined,
  };

  let docId = "";
  try {
    const ref = await adminDb()
      .collection(COLLECTIONS.INQUIRIES)
      .add({ ...inquiry, createdAt: FieldValue.serverTimestamp() });
    docId = ref.id;
  } catch (e) {
    console.error("Firestore 쓰기 실패:", e);
    return NextResponse.json(
      { error: "서버 저장에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  let sheetSyncedAt: string | null = null;
  try {
    await appendInquiryRow({
      createdAt,
      type: inquiry.type,
      name: inquiry.name,
      company: inquiry.company,
      phone: inquiry.phone,
      email: inquiry.email,
      message: inquiry.message,
    });
    sheetSyncedAt = new Date().toISOString();
    await adminDb()
      .collection(COLLECTIONS.INQUIRIES)
      .doc(docId)
      .update({ sheetSyncedAt });
  } catch (e) {
    console.error("Google Sheets 동기화 실패:", e);
    // Firestore 저장은 성공했으므로 사용자에겐 성공 응답.
  }

  // 관리자 알림 메일 — 실패해도 접수 자체는 성공 처리 (요청 20260702)
  try {
    const notifyTo =
      (await getIntegration("adminNotifyEmail")) || "withcomai@gmail.com";
    const tpl = inquiryNotifyTemplate({
      type: inquiry.type,
      name: inquiry.name,
      company: inquiry.company,
      phone: inquiry.phone,
      email: inquiry.email,
      message: inquiry.message,
      createdAt,
    });
    await sendMail({
      to: notifyTo,
      subject: tpl.subject,
      html: tpl.html,
      replyTo: inquiry.email,
    });
  } catch (e) {
    console.error("문의 접수 관리자 알림 메일 실패:", e);
  }

  return NextResponse.json({ id: docId, sheetSyncedAt });
}
