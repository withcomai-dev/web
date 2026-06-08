/**
 * 런모아 로그인 세션(클라이언트 보관).
 *
 * 정적 사이트라 세션 토큰을 localStorage 에 보관한다.
 * 토큰의 실제 형식/검증 방식은 런모아 반환 사양 확정 후 보강한다.
 */

export const RUNMOA_TOKEN_KEY = "runmoa.auth.token";

/** 저장된 런모아 토큰 (없으면 null) */
export function getRunmoaToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(RUNMOA_TOKEN_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

/** 로그인 여부 */
export function isRunmoaLoggedIn(): boolean {
  return getRunmoaToken() !== null;
}

/** 로그아웃 — 토큰/임시값 제거 */
export function runmoaLogout() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RUNMOA_TOKEN_KEY);
    localStorage.removeItem("runmoa.auth.code");
  } catch {
    // ignore
  }
}
