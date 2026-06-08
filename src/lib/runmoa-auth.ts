/**
 * 런모아 호스티드 로그인/회원가입 리다이렉트 헬퍼.
 *
 * 흐름:
 *   1. 사용자가 헤더의 "로그인"/"회원가입" 클릭
 *   2. 런모아가 호스팅하는 로그인 페이지로 이동
 *        https://www.runmoa.com/login?redirect_uri=<콜백>&client_id=withcomai&lg=kr
 *   3. 런모아에서 로그인/가입 완료 후 redirect_uri(우리 콜백)로 되돌아옴
 *   4. /auth/callback 페이지가 결과를 수신해 세션 처리
 *
 * 보안:
 *   - 이 파일은 클라이언트 번들에 포함된다. client_id 와 redirect_uri 만 사용한다.
 *   - client_secret 은 절대 여기(또는 어떤 클라이언트 코드)에도 두지 않는다.
 *     정적 사이트라 번들에 넣으면 그대로 노출되기 때문이다.
 */

const AUTH_BASE =
  process.env.NEXT_PUBLIC_RUNMOA_AUTH_BASE_URL ?? "https://www.runmoa.com";

const CLIENT_ID = process.env.NEXT_PUBLIC_RUNMOA_CLIENT_ID ?? "withcomai";

// 런모아 측 경로. 회원가입 경로는 런모아 사양에 맞게 .env 로 덮어쓸 수 있다.
const LOGIN_PATH = process.env.NEXT_PUBLIC_RUNMOA_LOGIN_PATH ?? "/login";
const REGISTER_PATH = process.env.NEXT_PUBLIC_RUNMOA_REGISTER_PATH ?? "/register";

const LANG = "kr";

/** 로그인 후 돌아올 위치를 잠시 저장해 두는 세션 키 */
const NEXT_KEY = "runmoa.auth.next";

/**
 * 런모아가 로그인 완료 후 되돌려보낼 콜백 주소.
 * - 운영: env(NEXT_PUBLIC_RUNMOA_REDIRECT_URI) 또는 현재 origin + /auth/callback
 * - 런모아 측에 이 주소가 화이트리스트로 등록돼 있어야 한다.
 */
export function runmoaRedirectUri(): string {
  const fromEnv = process.env.NEXT_PUBLIC_RUNMOA_REDIRECT_URI;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  return "https://withcomai-web.web.app/auth/callback";
}

function buildAuthUrl(path: string): string {
  const u = new URL(path, AUTH_BASE);
  u.searchParams.set("redirect_uri", runmoaRedirectUri());
  u.searchParams.set("client_id", CLIENT_ID);
  u.searchParams.set("lg", LANG);
  return u.toString();
}

/** 런모아 로그인 페이지 URL */
export function runmoaLoginUrl(): string {
  return buildAuthUrl(LOGIN_PATH);
}

/** 런모아 회원가입 페이지 URL */
export function runmoaRegisterUrl(): string {
  return buildAuthUrl(REGISTER_PATH);
}

/** 로그인/가입 시작. 돌아올 위치를 저장하고 런모아로 이동한다. */
export function startRunmoa(mode: "login" | "register", next?: string) {
  if (typeof window === "undefined") return;
  try {
    const target = next ?? window.location.pathname + window.location.search;
    if (target && target !== "/auth/callback") {
      sessionStorage.setItem(NEXT_KEY, target);
    }
  } catch {
    // sessionStorage 사용 불가 시 무시 (돌아올 위치만 못 잡을 뿐)
  }
  window.location.href =
    mode === "login" ? runmoaLoginUrl() : runmoaRegisterUrl();
}

/** 콜백에서 호출: 저장해 둔 "돌아올 위치"를 읽고 비운다. */
export function consumeRunmoaNext(): string {
  if (typeof window === "undefined") return "/";
  try {
    const v = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    return v && v.length > 0 ? v : "/";
  } catch {
    return "/";
  }
}
