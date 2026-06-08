/**
 * 런모아 로그인/회원가입 콜백 — 서버 라우트 핸들러.
 *
 * 런모아가 로그인 완료 후 redirect_uri(= 이 주소)로 사용자를 되돌려보낸다.
 * 페이지(클라이언트)가 아니라 여기(서버)에서 처리하는 이유:
 *   code → access_token 교환에 client_secret 이 필요한데, 클라이언트에 두면 노출된다.
 *   서버 라우트에서 교환하면 시크릿이 번들/브라우저에 절대 나가지 않는다.
 *
 * 흐름:
 *   1) 런모아가 ?code=... (또는 ?error=...) 로 이 핸들러를 호출
 *   2) 서버에서 code → access_token → 사용자 정보 조회 (시크릿 사용, 서버 전용)
 *   3) 결과를 URL 프래그먼트(#)에 담아 /auth/done 로 302 리다이렉트
 *      - 프래그먼트는 서버/로그로 전송되지 않으므로 토큰 노출면이 가장 작다
 *   4) /auth/done(클라이언트)이 localStorage 에 세션을 저장하고 원래 위치로 이동
 */

import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForToken, fetchRunmoaUser } from "@/lib/runmoa-oauth";
import { upsertRunmoaMember } from "@/lib/runmoa-members";

// 요청마다 code 가 다르므로 정적화 불가 — 항상 동적 실행.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** /auth/done 으로 프래그먼트를 실어 리다이렉트 */
function redirectToDone(origin: string, fragment: Record<string, string>) {
  const done = new URL("/auth/done", origin);
  done.hash = new URLSearchParams(fragment).toString();
  return NextResponse.redirect(done);
}

export async function GET(req: NextRequest) {
  const { origin, searchParams } = new URL(req.url);

  // 1) 에러 반환 처리
  const error =
    searchParams.get("error") ||
    searchParams.get("error_description") ||
    searchParams.get("message");
  if (error) {
    return redirectToDone(origin, { error });
  }

  // 2) 토큰이 직접 넘어오는 형식도 허용 (교환 단계 생략 가능)
  const directToken =
    searchParams.get("token") ||
    searchParams.get("access_token") ||
    searchParams.get("accessToken");

  // 3) 표준 흐름: authorization code
  const code = searchParams.get("code");

  if (!directToken && !code) {
    return redirectToDone(origin, { error: "콜백 파라미터가 없습니다 (code 누락)" });
  }

  try {
    const token = directToken ?? (await exchangeCodeForToken(code as string));
    const user = await fetchRunmoaUser(token);

    // 로그인 회원을 DB 에 기록(서버 전용). 저장 실패가 로그인 자체를 막지 않도록 non-fatal.
    try {
      await upsertRunmoaMember(user);
    } catch (e) {
      console.error("runmoaMembers upsert 실패:", e);
    }

    return redirectToDone(origin, { token, user: JSON.stringify(user) });
  } catch (e) {
    return redirectToDone(origin, {
      error: e instanceof Error ? e.message : "로그인 처리 중 오류가 발생했습니다",
    });
  }
}
