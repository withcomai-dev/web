import { NextRequest, NextResponse } from "next/server";
import { SchemaType } from "@google/generative-ai";
import { generateJSON } from "@/lib/gemini";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const SECTIONS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    sections: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          order: { type: SchemaType.INTEGER },
          visible: { type: SchemaType.BOOLEAN },
          type: {
            type: SchemaType.STRING,
            enum: ["hero", "cards", "feature", "richtext", "cta", "blog", "services", "contact"],
          },
          data: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              eyebrow: { type: SchemaType.STRING },
              subtitle: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              html: { type: SchemaType.STRING },
              bgImage: { type: SchemaType.STRING },
              image: { type: SchemaType.STRING },
              side: { type: SchemaType.STRING, enum: ["left", "right"] },
              columns: { type: SchemaType.INTEGER },
              bg: { type: SchemaType.STRING, enum: ["blue", "slate", "white"] },
              body: { type: SchemaType.STRING },
              items: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    icon: { type: SchemaType.STRING },
                    title: { type: SchemaType.STRING },
                    body: { type: SchemaType.STRING },
                  },
                },
              },
            },
          },
        },
        required: ["type", "data"],
      },
    },
  },
  required: ["sections"],
};

interface Body {
  prompt?: string;
  tone?: "professional" | "friendly" | "marketing";
  pageKey?: string;
  pageTitle?: string;
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

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) return NextResponse.json({ error: "프롬프트가 비어있습니다." }, { status: 400 });

  const toneMap = {
    professional: "전문적이고 신뢰감 있는",
    friendly: "친근하고 따뜻한",
    marketing: "강조와 행동 유도가 강한 마케팅",
  } as const;
  const tone = toneMap[body.tone ?? "professional"];

  const sysInstruction = `너는 위드컴정보(중소기업 IT/AI 솔루션 회사)의 웹사이트 페이지 빌더다.
사용자 요청을 받아 Hero, Cards, Feature, RichText, CTA, Blog, Services, Contact 중 적절한 섹션을 4-7개 생성한다.

규칙:
- 모든 텍스트는 한국어
- 톤: ${tone}
- 첫 섹션은 보통 "hero" (h1 제목 + 부제 + CTA 버튼)
- 카드/기능 항목은 3개 또는 4개 단위로 구성
- 아이콘 후보: cpu, zap, message-square, shield-check, users, monitor, shopping-bag, headphones, youtube, globe, sparkles
- richtext의 html은 <h2>, <p>, <ul>, <li> 등 표준 태그 사용
- 이미지 URL은 빈 문자열로 두기 (관리자가 직접 업로드)
- order는 1부터 순차, visible은 true
- id는 "${body.pageKey ?? "ai"}-{type}-{n}" 형식`;

  try {
    const result = await generateJSON<{ sections: unknown[] }>(prompt, {
      schema: SECTIONS_SCHEMA,
      systemInstruction: sysInstruction,
      endpoint: "page-generate",
      userId: user?.uid,
      maxOutputTokens: 8192,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI 호출 실패" },
      { status: 500 },
    );
  }
}
