import {
  COLLECTIONS,
  getSingletonDoc,
} from "@/lib/firestore";
import type { MemberGrade, MemberGradesDoc } from "@/types/cms";

/** 회원 등급 정의 저장 문서 id (siteSettings/memberGrades) — 관리자 추가 등급만 저장 */
export const MEMBER_GRADES_DOC_ID = "memberGrades";

/**
 * 기본 내장 등급 (요청 20260702) — 삭제 불가. 관리자 등급 목록과 별개로 항상 존재.
 * - 비회원: 로그인하지 않은 방문자
 * - 일반(회원): 로그인한 회원의 기본 등급 (회원가입 시 자동 부여)
 */
export const GUEST_GRADE_ID = "__guest__";
export const MEMBER_GRADE_ID = "__member__";
export const GUEST_GRADE: MemberGrade = { id: GUEST_GRADE_ID, label: "비회원" };
export const MEMBER_GRADE: MemberGrade = { id: MEMBER_GRADE_ID, label: "일반(회원)" };
/** 기본 등급 (비회원 → 일반회원 순) */
export const BUILTIN_GRADES: MemberGrade[] = [GUEST_GRADE, MEMBER_GRADE];

/** 관리자 추가 등급 목록을 읽는다(없으면 빈 배열). 공개 read 가능(siteSettings). */
export async function loadMemberGrades(): Promise<MemberGrade[]> {
  try {
    const doc = await getSingletonDoc<MemberGradesDoc>(
      COLLECTIONS.SETTINGS,
      MEMBER_GRADES_DOC_ID,
    );
    return Array.isArray(doc?.grades) ? doc!.grades : [];
  } catch {
    return [];
  }
}

/** 접근 설정 UI 용: 기본 등급(비회원·일반회원) + 관리자 추가 등급 */
export function gradesWithBuiltins(grades: MemberGrade[]): MemberGrade[] {
  return [...BUILTIN_GRADES, ...grades];
}

/**
 * 실효 등급 판정:
 * - 지정 등급이 있으면 그 등급
 * - 로그인 O + 미지정 → 일반(회원)  (회원가입 시 자동 일반회원)
 * - 로그인 X → 비회원
 */
export function effectiveGradeId(
  userGrade: string | undefined | null,
  loggedIn: boolean,
): string {
  return userGrade || (loggedIn ? MEMBER_GRADE_ID : GUEST_GRADE_ID);
}

/**
 * 콘텐츠·페이지·메뉴 열람 가능 여부.
 * - allowedGrades 가 비어있으면 전체 공개
 * - 관리자는 항상 열람
 * - 그 외에는 사용자의 실효 등급이 허용 목록에 있어야 함
 * 로딩 중에는 호출부에서 필터를 건너뛴다(fail-open).
 */
export function canViewContent(
  allowedGrades: string[] | undefined | null,
  userGrade: string | undefined | null,
  isAdmin: boolean,
  loggedIn = false,
): boolean {
  if (!allowedGrades || allowedGrades.length === 0) return true;
  if (isAdmin) return true;
  return allowedGrades.includes(effectiveGradeId(userGrade, loggedIn));
}

/** 등급 id → 라벨 */
export function gradeLabel(
  grades: MemberGrade[],
  id: string | undefined | null,
): string {
  if (!id) return "";
  if (id === GUEST_GRADE_ID) return GUEST_GRADE.label;
  if (id === MEMBER_GRADE_ID) return MEMBER_GRADE.label;
  return grades.find((g) => g.id === id)?.label ?? id;
}

/**
 * 접근 설정 UI 체크 여부 (기본 전체공개는 '전부 체크'로 표시).
 * allowedGrades 가 비어있으면(전체공개) 모든 등급이 체크된 것으로 본다.
 */
export function isGradeChecked(
  allowedGrades: string[] | undefined | null,
  gradeId: string,
): boolean {
  return !allowedGrades || allowedGrades.length === 0 || allowedGrades.includes(gradeId);
}

/**
 * 체크 토글. 전체공개(빈 배열)는 '전부 체크'로 간주하고 시작한다.
 * 다시 전부 체크되면 빈 배열(전체공개, 미래 등급 자동 포함)로 저장한다.
 */
export function toggleGrade(
  allowedGrades: string[] | undefined | null,
  gradeId: string,
  allIds: string[],
): string[] {
  const isPublic = !allowedGrades || allowedGrades.length === 0;
  const set = new Set<string>(isPublic ? allIds : allowedGrades);
  if (set.has(gradeId)) set.delete(gradeId);
  else set.add(gradeId);
  const arr = allIds.filter((id) => set.has(id));
  return arr.length === allIds.length ? [] : arr; // 전부 체크 = 전체공개(빈 배열)
}
