import { NextRequest, NextResponse } from "next/server";
import { SchemaType } from "@google/generative-ai";
import { generateJSON } from "@/lib/gemini";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";

const SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    ogTitle: { type: SchemaType.STRING },
    ogDescription: { type: SchemaType.STRING },
    keywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["title", "description"],
};

interface Body {
  title?: string;
  bodyHtml?: string;
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAdmin(req);
  if (errorResponse) return errorResponse;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "잘못된 본문" }, { status: 400 });
  }

  const text = `제목: ${body.title ?? ""}\n본문(HTML): ${(body.bodyHtml ?? "").slice(0, 4000)}`;

  try {
    const data = await generateJSON(text, {
      schema: SCHEMA,
      systemInstruction: `위드컴정보 사이트의 SEO 메타데이터를 생성한다.
- title: 60자 이내, 한국어, 키워드 포함
- description: 120-160자, 한국어, 행동 유도
- ogTitle: title보다 짧게, 클릭 유도
- ogDescription: 80-100자
- keywords: 5-8개, 검색 의도 반영`,
      endpoint: "seo",
      userId: user?.uid,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI 호출 실패" },
      { status: 500 },
    );
  }
}
