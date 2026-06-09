/**
 * 통합 로그아웃 — 런모아 세션 + Firebase 세션 + 모든 인증 관련 저장소를 완전히 정리하고
 * 로그인 화면으로 이동한다. (공개 헤더/어드민 어디서 눌러도 동일하게 완전 로그아웃)
 *
 * 정리 대상:
 *  - 런모아 토큰/사용자/자동로그인 임시값 (localStorage `runmoa.*`)
 *  - 프로필 캐시 (localStorage `withcom.auth.*`)
 *  - 로그인 후 복귀 위치 등 (sessionStorage `runmoa.*`)
 *  - Firebase 인증 세션 (signOut → IndexedDB/localStorage 의 authUser 제거)
 *
 * NEXT_PUBLIC_RUNMOA_LOGOUT_URL 이 설정되면, 로컬 정리 후 런모아 로그아웃 주소로 이동해
 * 런모아 쪽 SSO 세션까지 종료한다(재로그인 시 로그인 폼이 다시 표시되도록). 없으면 /login 으로.
 */
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { runmoaLogout } from "@/lib/runmoa-session";

function clearAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    runmoaLogout();
  } catch {
    // ignore
  }
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith("runmoa.") || k.startsWith("withcom.auth")) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
  try {
    for (const k of Object.keys(sessionStorage)) {
      if (k.startsWith("runmoa.")) sessionStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}

/** 완전 로그아웃 후 로그인 화면(또는 런모아 로그아웃 URL)으로 이동. */
export async function fullLogout(): Promise<void> {
  clearAuthStorage();
  // signOut 이 혹시 지연/행이 걸려도 리다이렉트를 막지 않도록 타임아웃과 경쟁.
  try {
    await Promise.race([
      signOut(auth),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    // Firebase 세션이 없던 경우 등은 무시
  }
  // Firebase 영속 세션 잔여 키(localStorage) 백업 정리 — IndexedDB 는 signOut 이 처리.
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith("firebase:") || k.includes("firebaseLocalStorage")) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    // 런모아 SSO 세션까지 종료: 런모아 로그아웃 엔드포인트로 이동 → 끝나면 우리 /login 으로 복귀.
    // (이렇게 해야 재로그인 시 런모아가 자동 통과시키지 않고 로그인 폼을 다시 보여준다)
    const override = process.env.NEXT_PUBLIC_RUNMOA_LOGOUT_URL;
    let dest: string;
    if (override && override.length > 0) {
      dest = override;
    } else {
      const redirectTo = encodeURIComponent(`${window.location.origin}/login`);
      const authBase = (
        process.env.NEXT_PUBLIC_RUNMOA_AUTH_BASE_URL || "https://www.runmoa.com"
      ).replace(/\/+$/, "");
      dest = `${authBase}/?runmoa-logout=true&redirect_to=${redirectTo}`;
    }
    // replace 로 이동해 뒤로가기로 이전 로그인 상태가 복원되지 않게 한다.
    window.location.replace(dest);
  }
}
