/**
 * 무료(정적) 배포 모드에서는 서버 API 라우트가 없으므로,
 * 서버가 필요한 기능은 이 에러로 친절하게 막는다.
 */
export const STATIC_MODE_DISABLED_MSG =
  "이 기능은 무료(정적) 배포 모드에서는 사용할 수 없습니다. (서버/유료 호스팅 필요)";

export function featureDisabled(): never {
  throw new Error(STATIC_MODE_DISABLED_MSG);
}
