import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { getIntegration } from "@/lib/integrations";

type Schema = unknown;

let _client: GoogleGenerativeAI | null = null;
let _clientKey: string = "";

async function getClient(): Promise<GoogleGenerativeAI> {
  const apiKey = await getIntegration("geminiApiKey");
  if (!apiKey) {
    throw new Error("Gemini API 키가 설정되지 않았습니다. 어드민 → 외부 서비스 키에서 입력하세요.");
  }
  if (_client && _clientKey === apiKey) return _client;
  _client = new GoogleGenerativeAI(apiKey);
  _clientKey = apiKey;
  return _client;
}

export type GeminiModelName = "gemini-2.5-flash" | "gemini-2.5-pro";

interface GenerateOpts {
  model?: GeminiModelName;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  endpoint?: string;
  userId?: string;
}

async function logUsage(
  endpoint: string,
  model: string,
  durationMs: number,
  promptTokens: number,
  outputTokens: number,
  userId?: string,
) {
  try {
    const FLASH_PRICE_PER_1K = 0.00003 + 0.00012;
    const PRO_PRICE_PER_1K = 0.00125 + 0.005;
    const rate = model.includes("pro") ? PRO_PRICE_PER_1K : FLASH_PRICE_PER_1K;
    const totalTokens = promptTokens + outputTokens;
    const costEstimate = (totalTokens / 1000) * rate;

    await adminDb()
      .collection("aiUsageLogs")
      .add({
        endpoint,
        userId: userId ?? null,
        model,
        promptTokens,
        outputTokens,
        totalTokens,
        costEstimate,
        durationMs,
        createdAt: FieldValue.serverTimestamp(),
      });
  } catch {
    // 로깅 실패는 무시 (메인 응답을 막지 않음)
  }
}

export async function generate(prompt: string, opts: GenerateOpts = {}): Promise<string> {
  const model = opts.model ?? "gemini-2.5-flash";
  const start = Date.now();

  const client = await getClient();
  const generativeModel = client.getGenerativeModel({
    model,
    systemInstruction: opts.systemInstruction,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 4096,
    },
  });

  const result = await generativeModel.generateContent(prompt);
  const text = result.response.text();
  const usage = result.response.usageMetadata;

  await logUsage(
    opts.endpoint ?? "generate",
    model,
    Date.now() - start,
    usage?.promptTokenCount ?? 0,
    usage?.candidatesTokenCount ?? 0,
    opts.userId,
  );

  return text;
}

interface GenerateJSONOpts<T> extends GenerateOpts {
  schema: Schema;
}

export async function generateJSON<T>(prompt: string, opts: GenerateJSONOpts<T>): Promise<T> {
  const model = opts.model ?? "gemini-2.5-flash";
  const start = Date.now();

  const client = await getClient();
  const generativeModel = client.getGenerativeModel({
    model,
    systemInstruction: opts.systemInstruction,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 8192,
      responseMimeType: "application/json",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: opts.schema as any,
    },
  });

  const result = await generativeModel.generateContent(prompt);
  const text = result.response.text();
  const usage = result.response.usageMetadata;

  await logUsage(
    opts.endpoint ?? "generateJSON",
    model,
    Date.now() - start,
    usage?.promptTokenCount ?? 0,
    usage?.candidatesTokenCount ?? 0,
    opts.userId,
  );

  return JSON.parse(text) as T;
}

export async function analyzeImage(
  base64DataUrl: string,
  prompt: string,
  opts: GenerateOpts = {},
): Promise<string> {
  const model = opts.model ?? "gemini-2.5-flash";
  const start = Date.now();

  const client = await getClient();
  const generativeModel = client.getGenerativeModel({
    model,
    systemInstruction: opts.systemInstruction,
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxOutputTokens ?? 2048,
    },
  });

  const m = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!m) throw new Error("올바른 base64 data URL이 아닙니다.");
  const [, mimeType, data] = m;

  const result = await generativeModel.generateContent([
    { inlineData: { data, mimeType } },
    { text: prompt },
  ]);
  const text = result.response.text();
  const usage = result.response.usageMetadata;

  await logUsage(
    opts.endpoint ?? "analyzeImage",
    model,
    Date.now() - start,
    usage?.promptTokenCount ?? 0,
    usage?.candidatesTokenCount ?? 0,
    opts.userId,
  );

  return text;
}
