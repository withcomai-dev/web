import { NextRequest, NextResponse } from "next/server";
import { sendMail, helpAnswerTemplate } from "@/lib/mail";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";

interface Body {
  to?: string;
  question?: string;
  answer?: string;
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin(req);
  if (errorResponse) return errorResponse;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "잘못된 본문" }, { status: 400 });
  }

  if (!body.to || !body.answer) {
    return NextResponse.json({ error: "to, answer 필수" }, { status: 400 });
  }

  try {
    const tpl = helpAnswerTemplate({
      question: body.question ?? "",
      answer: body.answer,
    });
    await sendMail({ to: body.to, subject: tpl.subject, html: tpl.html });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "메일 발송 실패" },
      { status: 500 },
    );
  }
}
