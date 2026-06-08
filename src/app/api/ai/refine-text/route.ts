import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/gemini";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";

interface Body {
  text?: string;
  mode?: "polish" | "summarize" | "expand";
}

const MODE_PROMPT: Record<NonNullable<Body["mode"]>, string> = {
  polish: "다음 글의 어색한 표현·맞춤법·가독성을 개선하되 원문의 의미와 길이는 유지하라.",
  summarize: "다음 글을 한국어로 핵심만 1/3 길이로 간결하게 요약하라.",
  expand: "다음 글을 한국어로 2배 길이로 확장하되 자연스럽게 예시·디테일을 추가하라.",
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

  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "텍스트가 비어있습니다." }, { status: 400 });

  const mode = body.mode ?? "polish";
  const prompt = `${MODE_PROMPT[mode]}\n\n[원문]\n${text}\n\n[결과]`;

  try {
    const result = await generate(prompt, {
      endpoint: "refine-text",
      userId: user?.uid,
      maxOutputTokens: 2048,
      systemInstruction: "결과만 출력하라. 부연 설명·주석·따옴표·코드 블록 표시는 일체 붙이지 말라.",
    });
    return NextResponse.json({ result: result.trim() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI 호출 실패" },
      { status: 500 },
    );
  }
}
