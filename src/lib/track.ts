// 홈페이지 방문·콘텐츠 조회 집계 beacon (자체 집계).
//
// - 서버 /api/track 로 sendBeacon(실패해도 사용자 경험 무영향).
// - ⚠️ 로컬 개발(localhost)에선 전송하지 않는다 — 실집계(prod Firestore) 오염 방지.
// - 순방문/세션 중복은 localStorage·sessionStorage 로 근사 판정(쿠키리스 → 개인정보 동의 불필요).

const VISITOR_KEY = "wc_visitor"; // 최초 방문자 여부
const DAY_KEY = "wc_visit_day"; // 마지막 방문 날짜(방문자 로컬)

/** 집계 전송 대상 환경인지 — 로컬/서버사이드는 제외 */
function isTrackable(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0") return false;
  return true;
}

function send(payload: Record<string, unknown>): void {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    // 집계 실패는 무시
  }
}

/** 방문자 로컬 기준 오늘 날짜 (YYYY-MM-DD) */
function localToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** 페이지뷰 집계 — 라우트 진입 시 호출 */
export function trackPageview(path: string): void {
  if (!isTrackable()) return;
  // 관리자·인증 흐름은 방문 통계에서 제외
  if (path.startsWith("/admin") || path.startsWith("/auth")) return;

  let newVisitor = false;
  let newToday = false;
  try {
    if (!localStorage.getItem(VISITOR_KEY)) {
      localStorage.setItem(VISITOR_KEY, "1");
      newVisitor = true;
    }
    const today = localToday();
    if (localStorage.getItem(DAY_KEY) !== today) {
      localStorage.setItem(DAY_KEY, today);
      newToday = true;
    }
  } catch {
    // 프라이빗 모드 등 localStorage 불가 — 페이지뷰만 집계
  }
  send({ kind: "pageview", path, newVisitor, newToday });
}

/** 콘텐츠 상세 조회수 집계 — 세션당 문서 1회 */
export function trackContentView(collection: string, id: string): void {
  if (!isTrackable() || !id) return;
  try {
    const k = `wc_v_${collection}_${id}`;
    if (sessionStorage.getItem(k)) return; // 중복 방지(세션당 1회)
    sessionStorage.setItem(k, "1");
  } catch {
    // sessionStorage 불가 시 그대로 1회 집계(허용)
  }
  send({ kind: "content", collection, id });
}
