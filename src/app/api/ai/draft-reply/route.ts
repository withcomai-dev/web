import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/gemini";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";

interface Body {
  question?: string;
  context?: string;
  tone?: "friendly" | "formal" | "apologetic";
}

const TONE_HINT: Record<NonNullable<Body["tone"]>, string> = {
  friendly: "친근하고 따뜻한 어조로",
  formal: "공식적이고 정중한 어조로",
  apologetic: "고객 불편에 대한 사과를 담아 정중한 어조로",
};

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAdmin(req);
  if (errorResponse) return errorResponse;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "잘못된 본문" }, { status: 400 });
  }

  const q = (body.question ?? "").trim();
  if (!q) return NextResponse.json({ error: "질문이 비어있습니다." }, { status: 400 });

  const tone = TONE_HINT[body.tone ?? "formal"];

  const prompt = `다음 고객 문의/질문에 대한 답변을 작성하세요.

[질문]
${q}

${body.context ? `[참고 자료]\n${body.context}\n` : ""}

규칙:
- 한국어
- ${tone}
- 위드컴정보(중소기업 IT/AI 솔루션 회사)의 입장
- 명확한 정보 제공 + 추가 문의 안내로 마무리
- 5-10문장 이내`;

  try {
    const text = await generate(prompt, {
      endpoint: "draft-reply",
      userId: user?.uid,
      maxOutputTokens: 1024,
    });
    return NextResponse.json({ result: text.trim() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI 호출 실패" },
      { status: 500 },
    );
  }
}
