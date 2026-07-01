import {
  COLLECTIONS,
  getSingletonDoc,
} from "@/lib/firestore";
import type { MemberGrade, MemberGradesDoc } from "@/types/cms";

/** 회원 등급 정의 저장 문서 id (siteSettings/memberGrades) */
export const MEMBER_GRADES_DOC_ID = "memberGrades";

/**
 * 비회원·등급 미지정 사용자를 나타내는 기본(유사) 등급.
 * 실제 등급 목록(memberGrades)에는 저장하지 않고, 접근 설정 UI 에서만 맨 앞에 노출한다.
 * 요청 20260701 — "비회원도 기본등급"으로 페이지·메뉴 권한 설정 가능.
 */
export const GUEST_GRADE_ID = "__guest__";
export const GUEST_GRADE: MemberGrade = { id: GUEST_GRADE_ID, label: "비회원(기본)" };

/** 등급 정의 목록을 읽는다(없으면 빈 배열). 공개 read 가능(siteSettings). */
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

/** 접근 설정 UI 용: 맨 앞에 '비회원(기본)' 을 붙인 등급 목록 */
export function gradesWithGuest(grades: MemberGrade[]): MemberGrade[] {
  return [GUEST_GRADE, ...grades];
}

/**
 * 콘텐츠·페이지·메뉴를 현재 사용자가 열람할 수 있는지 판정.
 * - allowedGrades 가 비어있으면 전체 공개
 * - 관리자는 항상 열람
 * - 그 외에는 사용자의 "실효 등급"(등급 없으면 비회원 기본등급)이 허용 목록에 있어야 함
 * 등급 정보가 아직 로딩 중일 수 있으므로, 호출부에서 로딩 중에는 필터를 건너뛴다(fail-open).
 */
export function canViewContent(
  allowedGrades: string[] | undefined | null,
  userGrade: string | undefined | null,
  isAdmin: boolean,
): boolean {
  if (!allowedGrades || allowedGrades.length === 0) return true;
  if (isAdmin) return true;
  const effective = userGrade || GUEST_GRADE_ID; // 비회원/미지정 = 기본등급
  return allowedGrades.includes(effective);
}

/** 등급 id → 라벨 */
export function gradeLabel(
  grades: MemberGrade[],
  id: string | undefined | null,
): string {
  if (!id) return "";
  if (id === GUEST_GRADE_ID) return GUEST_GRADE.label;
  return grades.find((g) => g.id === id)?.label ?? id;
}
