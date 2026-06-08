/**
 * 런모아 OAuth 코드↔토큰 교환 + 사용자 정보 조회.
 *
 * 흐름(Authorization Code):
 *   1) 콜백으로 받은 code 를 token-issue 로 보내 access_token 발급
 *   2) access_token 으로 user-info 조회
 *
 * 엔드포인트(런모아 WordPress 플러그인: rest prefix 가 'api' 로 변경됨):
 *   GET {base}/api/oauth/token-issue?client_id=&code=&lg=kr
 *       헤더: Authorization: client_secret <SECRET>   (비표준 형식)
 *       응답: { result:"success", access_token, expires_in }
 *   GET {base}/api/oauth/user-info?lg=kr
 *       헤더: Authorization: Bearer <access_token>
 *       응답: { result:"success", user_id, id, user_name, user_email, ... }
 *
 * 🔒 보안: 이 모듈은 서버 전용(`server-only`)이다. client_secret 은
 *    NEXT_PUBLIC_* 가 아닌 서버 환경변수 RUNMOA_CLIENT_SECRET 로만 읽으며,
 *    클라이언트 번들에 포함되지 않는다. /auth/callback 라우트 핸들러에서만 호출한다.
 */

import "server-only";

const AUTH_BASE =
  process.env.NEXT_PUBLIC_RUNMOA_AUTH_BASE_URL ?? "https://www.runmoa.com";
const CLIENT_ID = process.env.NEXT_PUBLIC_RUNMOA_CLIENT_ID ?? "withcomai";
// 서버 전용 시크릿 (NEXT_PUBLIC_ 접두사 금지 — 번들 노출 방지)
const CLIENT_SECRET = process.env.RUNMOA_CLIENT_SECRET ?? "";
const LANG = "kr";

export interface RunmoaUser {
  user_id: number;
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  social_channel: string;
  marketing_agree: string;
}

/** 인가 코드 → access_token */
export async function exchangeCodeForToken(code: string): Promise<string> {
  if (!CLIENT_SECRET) {
    throw new Error("client_secret 미설정 (RUNMOA_CLIENT_SECRET)");
  }
  const url = new URL(`${AUTH_BASE}/api/oauth/token-issue`);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("code", code);
  url.searchParams.set("lg", LANG);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `client_secret ${CLIENT_SECRET}` },
  });
  const data = (await res.json().catch(() => null)) as
    | { result?: string; access_token?: string; msg?: string }
    | null;

  if (!res.ok || data?.result !== "success" || !data.access_token) {
    throw new Error(data?.msg || `token-issue 실패 (HTTP ${res.status})`);
  }
  return data.access_token;
}

/** access_token → 사용자 정보 */
export async function fetchRunmoaUser(accessToken: string): Promise<RunmoaUser> {
  const url = new URL(`${AUTH_BASE}/api/oauth/user-info`);
  url.searchParams.set("lg", LANG);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json().catch(() => null)) as
    | (Partial<RunmoaUser> & { result?: string; msg?: string })
    | null;

  if (!res.ok || data?.result !== "success") {
    throw new Error(data?.msg || `user-info 실패 (HTTP ${res.status})`);
  }
  return data as RunmoaUser;
}
