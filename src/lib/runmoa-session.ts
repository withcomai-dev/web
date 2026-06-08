/**
 * 런모아 로그인 세션(클라이언트 보관).
 *
 * 정적 사이트라 access_token 과 사용자 정보를 localStorage 에 보관한다.
 */

import type { RunmoaUser } from "@/lib/runmoa-oauth";

export const RUNMOA_TOKEN_KEY = "runmoa.auth.token";
export const RUNMOA_USER_KEY = "runmoa.auth.user";

/** 저장된 런모아 access_token (없으면 null) */
export function getRunmoaToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(RUNMOA_TOKEN_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

/** 저장된 런모아 사용자 정보 (없으면 null) */
export function getRunmoaUser(): RunmoaUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RUNMOA_USER_KEY);
    return raw ? (JSON.parse(raw) as RunmoaUser) : null;
  } catch {
    return null;
  }
}

/** 로그인 세션 저장 (토큰 + 사용자) */
export function setRunmoaSession(token: string, user: RunmoaUser) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RUNMOA_TOKEN_KEY, token);
    localStorage.setItem(RUNMOA_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore quota errors
  }
}

/** 로그인 여부 */
export function isRunmoaLoggedIn(): boolean {
  return getRunmoaToken() !== null;
}

/** 로그아웃 — 토큰/사용자/임시값 제거 */
export function runmoaLogout() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RUNMOA_TOKEN_KEY);
    localStorage.removeItem(RUNMOA_USER_KEY);
    localStorage.removeItem("runmoa.auth.code");
  } catch {
    // ignore
  }
}
