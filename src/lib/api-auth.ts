import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

export interface AuthedUser {
  uid: string;
  email: string | null;
  role: "user" | "admin" | "superadmin";
}

/**
 * 요청 헤더의 Bearer 토큰을 검증하고 관리자 권한을 확인한다.
 * 클라이언트는 firebase auth.currentUser.getIdToken() 으로 ID 토큰을 보내야 한다.
 *
 * 개발 우회 모드 (NEXT_PUBLIC_DEV_BYPASS_AUTH=true): 인증 검사 생략, 슈퍼관리자로 동작.
 */
export async function requireAdmin(req: NextRequest): Promise<{
  user: AuthedUser | null;
  errorResponse: NextResponse | null;
}> {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return {
      user: { uid: "dev-bypass-uid", email: "dev@local", role: "superadmin" },
      errorResponse: null,
    };
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const m = authHeader.match(/^Bearer (.+)$/);
  if (!m) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "인증 필요" }, { status: 401 }),
    };
  }

  try {
    const decoded = await getAuth().verifyIdToken(m[1]);
    const userDoc = await adminDb().collection("users").doc(decoded.uid).get();
    const role = (userDoc.data()?.role as AuthedUser["role"]) ?? "user";
    if (role !== "admin" && role !== "superadmin") {
      return {
        user: null,
        errorResponse: NextResponse.json({ error: "관리자 권한 필요" }, { status: 403 }),
      };
    }
    return {
      user: { uid: decoded.uid, email: decoded.email ?? null, role },
      errorResponse: null,
    };
  } catch (e) {
    console.error("토큰 검증 실패:", e);
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "유효하지 않은 토큰" }, { status: 401 }),
    };
  }
}

/**
 * 분당 N회 rate limit (Firestore 기반).
 */
export async function checkRateLimit(
  uid: string,
  endpoint: string,
  perMinute = 20,
): Promise<{ allowed: boolean; errorResponse: NextResponse | null }> {
  try {
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const snap = await adminDb()
      .collection("aiUsageLogs")
      .where("userId", "==", uid)
      .where("endpoint", "==", endpoint)
      .where("createdAt", ">=", oneMinAgo)
      .count()
      .get();
    if (snap.data().count >= perMinute) {
      return {
        allowed: false,
        errorResponse: NextResponse.json(
          { error: `요청이 너무 많습니다. (분당 ${perMinute}회 한도)` },
          { status: 429 },
        ),
      };
    }
    return { allowed: true, errorResponse: null };
  } catch {
    // 카운트 실패 시 통과 (인덱스 부재 등)
    return { allowed: true, errorResponse: null };
  }
}
