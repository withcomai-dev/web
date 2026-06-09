/**
 * 런모아 로그인 사용자의 어드민 권한(역할) 해석 + Firebase 커스텀 토큰 발급. (서버 전용)
 *
 * 런모아 사용자는 Firebase 세션이 없으므로, 로그인 시 서버가 커스텀 토큰을 발급해
 * uid=`runmoa:<user_id>` + role 클레임을 가진 진짜 Firebase 세션을 부여한다.
 * 그러면 기존 Firebase 인증 기반 어드민 인프라(firestore.rules·api-auth·클라 쓰기)를
 * 그대로 재사용하면서 권한이 서버에서 강제된다.
 *
 * 역할: superadmin / admin / user
 *  - super_admin: user_email 이 NEXT_PUBLIC_SUPER_ADMIN_EMAIL 과 일치 (기본 crinsader@naver.com)
 *  - admin/user: users/`runmoa:<id>` 문서의 role (super_admin 이 /admin/users 에서 지정)
 */

import "server-only";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import type { RunmoaUser } from "@/lib/runmoa-oauth";
import type { UserRole } from "@/types/cms";

const SUPER_ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ?? ""
).toLowerCase();

/** 런모아 user_id → Firebase Auth uid */
export function runmoaUid(userId: number | string): string {
  return `runmoa:${userId}`;
}

/**
 * 역할 해석 + users 문서 동기화. (Admin SDK — 규칙 우회)
 * super_admin 이메일이면 항상 superadmin, 아니면 기존 저장된 role 유지(없으면 user).
 */
export async function resolveAndSyncRole(user: RunmoaUser): Promise<UserRole> {
  const uid = runmoaUid(user.user_id);
  const email = (user.user_email ?? "").toLowerCase();
  const isSuper = SUPER_ADMIN_EMAIL.length > 0 && email === SUPER_ADMIN_EMAIL;

  const ref = adminDb().collection(COLLECTIONS.USERS).doc(uid);
  const snap = await ref.get();
  const existingRole = snap.data()?.role as UserRole | undefined;

  let role: UserRole = "user";
  if (isSuper) role = "superadmin";
  else if (existingRole) role = existingRole;

  const now = new Date().toISOString();
  await ref.set(
    {
      email: user.user_email ?? "",
      displayName: user.user_name ?? "",
      role,
      status: snap.data()?.status ?? "active",
      provider: "runmoa",
      runmoaUserId: user.user_id,
      lastLoginAt: now,
      ...(snap.exists ? {} : { createdAt: now }),
    },
    { merge: true },
  );

  return role;
}

/**
 * 런모아 사용자 → 역할 동기화 + Firebase 커스텀 토큰 발급.
 * (ADC 환경에서 서명하려면 컴퓨트 SA 에 roles/iam.serviceAccountTokenCreator 필요)
 */
export async function createRunmoaFirebaseToken(
  user: RunmoaUser,
): Promise<string> {
  const role = await resolveAndSyncRole(user);
  return adminAuth().createCustomToken(runmoaUid(user.user_id), {
    role,
    runmoaUserId: user.user_id,
    email: user.user_email ?? "",
  });
}
