/**
 * 런모아 로그인 회원을 Firestore 에 기록 (서버 전용).
 *
 * /auth/callback 서버 라우트에서 사용자 정보 조회에 성공한 직후 호출한다.
 * Admin SDK(서버)로만 쓰며, 클라이언트 쓰기는 firestore.rules 에서 차단한다.
 * 문서 ID = 런모아 user_id 이므로 재로그인 시 같은 문서가 갱신되고
 * loginCount 가 누적된다(트랜잭션으로 firstLoginAt 은 최초 1회만 기록).
 */

import "server-only";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import type { RunmoaUser } from "@/lib/runmoa-oauth";

/** 런모아 사용자 → runmoaMembers upsert (실패해도 로그인 흐름은 막지 않음) */
export async function upsertRunmoaMember(user: RunmoaUser): Promise<void> {
  // 문서 ID = user_id. 누락/빈값이면 잘못된 문서가 생기므로 기록하지 않는다.
  const memberId = String(user.user_id ?? "").trim();
  if (!memberId || memberId === "undefined" || memberId === "null") {
    throw new Error("runmoaMembers upsert: 유효한 user_id 가 없습니다");
  }

  const ref = adminDb().collection(COLLECTIONS.RUNMOA_MEMBERS).doc(memberId);

  const now = new Date().toISOString();
  const base = {
    runmoaUserId: user.user_id,
    loginId: user.id ?? "",
    name: user.user_name ?? "",
    email: user.user_email ?? "",
    phone: user.user_phone || null,
    socialChannel: user.social_channel || null,
    marketingAgree: user.marketing_agree || null,
    lastLoginAt: now,
    updatedAt: now,
  };

  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      tx.update(ref, { ...base, loginCount: FieldValue.increment(1) });
    } else {
      tx.set(ref, { ...base, firstLoginAt: now, loginCount: 1 });
    }
  });
}
