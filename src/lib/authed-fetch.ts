/**
 * 어드민 API 호출용 fetch — 현재 Firebase 세션의 ID 토큰을 Authorization 헤더로 첨부한다.
 * (런모아 로그인 사용자는 커스텀 토큰으로 Firebase 세션을 가지므로 getIdToken 사용 가능)
 * 서버 라우트의 requireAdmin 이 이 토큰을 검증한다.
 */
import { auth } from "@/lib/firebase";

export async function authedFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } catch {
    // 토큰을 못 얻으면 헤더 없이 진행 — 서버가 401 로 거절한다.
  }
  return fetch(input, { ...init, headers });
}
