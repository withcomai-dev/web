import { NextRequest, NextResponse } from "next/server";
import { generate, analyzeImage } from "@/lib/gemini";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ConsoleErr {
  message: string;
  source?: string;
  line?: number;
  stack?: string;
}
interface NetErr {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
}

interface Body {
  message?: string;
  url?: string;
  routeFile?: string;
  consoleErrors?: ConsoleErr[];
  networkErrors?: NetErr[];
  screenshotUrl?: string;
}

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    const b64 = Buffer.from(buf).toString("base64");
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
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

  const ctx = [
    `사용자 신고: ${body.message ?? "(없음)"}`,
    `URL: ${body.url ?? "?"}`,
    `추정 라우트 파일: ${body.routeFile ?? "?"}`,
    "",
    "최근 콘솔 에러:",
    ...(body.consoleErrors ?? []).slice(-5).map(
      (e) => `  - ${e.message}${e.source ? ` (${e.source}:${e.line})` : ""}`,
    ),
    "",
    "최근 네트워크 실패:",
    ...(body.networkErrors ?? []).slice(-5).map(
      (n) => `  - ${n.method} ${n.url} → ${n.status ?? "FAIL"} ${n.statusText ?? ""}`,
    ),
  ].join("\n");

  const prompt = `다음 버그 신고를 분석하고, 한국어로 다음 형식으로 답하라:

## 추정 원인
(2-3문장)

## 영향 범위
(어떤 사용자/페이지에 영향)

## 우선순위
(P0/P1/P2/P3 중 하나 + 이유)

## 수정 방향
(개발자가 어디부터 봐야 할지 — 구체적 파일·함수)

## 임시 우회 방법
(있을 경우만)

[신고 컨텍스트]
${ctx}`;

  try {
    let text: string;
    if (body.screenshotUrl) {
      const base64 = await urlToBase64(body.screenshotUrl);
      if (base64) {
        text = await analyzeImage(base64, prompt, {
          endpoint: "analyze-feedback",
          userId: user?.uid,
        });
      } else {
        text = await generate(prompt, {
          endpoint: "analyze-feedback",
          userId: user?.uid,
        });
      }
    } else {
      text = await generate(prompt, {
        endpoint: "analyze-feedback",
        userId: user?.uid,
      });
    }
    return NextResponse.json({ analysis: text.trim() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI 호출 실패" },
      { status: 500 },
    );
  }
}
