import {
  COLLECTIONS,
  getSingletonDoc,
} from "@/lib/firestore";
import type { MemberGrade, MemberGradesDoc } from "@/types/cms";

/** 회원 등급 정의 저장 문서 id (siteSettings/memberGrades) */
export const MEMBER_GRADES_DOC_ID = "memberGrades";

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

/**
 * 콘텐츠(또는 AI TOOL)를 현재 사용자가 열람할 수 있는지 판정.
 * - allowedGrades 가 비어있으면 전체 공개
 * - 관리자는 항상 열람
 * - 그 외에는 사용자 등급이 허용 목록에 있어야 함
 * 등급 정보가 아직 로딩 중일 수 있으므로, 호출부에서 로딩 중에는 필터를 건너뛴다(fail-open).
 */
export function canViewContent(
  allowedGrades: string[] | undefined | null,
  userGrade: string | undefined | null,
  isAdmin: boolean,
): boolean {
  if (!allowedGrades || allowedGrades.length === 0) return true;
  if (isAdmin) return true;
  if (!userGrade) return false;
  return allowedGrades.includes(userGrade);
}

/** 등급 id → 라벨 */
export function gradeLabel(
  grades: MemberGrade[],
  id: string | undefined | null,
): string {
  if (!id) return "";
  return grades.find((g) => g.id === id)?.label ?? id;
}
