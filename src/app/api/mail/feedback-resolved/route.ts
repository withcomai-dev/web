import { NextRequest, NextResponse } from "next/server";
import { sendMail, feedbackResolvedTemplate } from "@/lib/mail";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";

interface Body {
  to?: string;
  message?: string;
  resolution?: string;
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
  if (!body.to || !body.message) {
    return NextResponse.json({ error: "to, message 필수" }, { status: 400 });
  }

  try {
    const tpl = feedbackResolvedTemplate({
      message: body.message,
      resolution: body.resolution,
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
