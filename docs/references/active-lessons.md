# active-lessons.md — 최근 30일 활성 경고

> **모든 에이전트가 작업 시작 전 필수로 읽는 경량 경고 목록.**
> 실수/버그/품질 위반 발견 시 **즉시** 추가 (반영자 기다리지 말 것).
> 1회 발생 = 즉시 추가. 보안·안정성 패턴은 AGENTS.md에 즉시 영구 승격.
> 만료(30일) 항목은 반영자가 주간 정리 시 제거하거나 lessons.md로 승격.

---

<!-- 새 경고는 이 아래에 추가. 형식:

## YYYY-MM-DD | {에이전트명} | {패턴 한줄 요약}
- **패턴**: {어떤 상황에서 발생하는가}
- **차단 방법**: {다음에 어떻게 피하는가}
- **만료**: {30일 후 날짜}

-->

## 2026-06-11 | 테스터 | E2E 셀렉터: `has-text` 부분일치가 헤더 드롭다운·푸터 동명 링크를 오염 매칭
- **패턴**: `a:has-text("공식 쇼핑몰")` 같은 전역 로케이터가 GNB 드롭다운의 "공식 쇼핑몰 바로가기"(visibility:hidden — boundingBox는 반환됨)나 푸터 링크를 first()로 잡아 위양성/위음성 발생. 모바일에선 데스크톱용 숨김 버튼(`hidden lg:flex` 내부)이 매칭돼 click 타임아웃.
- **차단 방법**: 항상 섹션 스코프(`section:has(...)`) 또는 `:visible` 한정으로 매칭. nav 검증은 `page.locator('nav')` 범위 한정.
- **만료**: 2026-07-11

## 2026-06-11 | 배포자 | push 직후 수동 롤아웃이 자동 롤아웃과 충돌(Conflict for resource)
- **패턴**: ABIU(자동 빌드) 활성 백엔드에서 `git push` 직후 `apphosting:rollouts:create` 실행 시 "version ... was specified but current version is ..." 충돌 — push가 트리거한 자동 롤아웃이 이미 진행 중. 수동 롤아웃 실패가 곧 배포 실패는 아님.
- **차단 방법**: 충돌 에러 시 REST로 롤아웃 상태 확인(`GET https://firebaseapphosting.googleapis.com/v1beta/.../backends/withcomweb/rollouts` — firebase CLI refresh_token 토큰 교환). 최신 롤아웃이 BUILDING/SUCCEEDED면 그것을 추적, FAILED일 때만 수동 재시도.
- **만료**: 2026-07-11

## 2026-06-11 | 배포자 | `npm run deploy:rules`가 storage 미설정 프로젝트에서 실패
- **패턴**: deploy:rules 스크립트가 `firestore:rules,storage`를 함께 배포하는데 이 프로젝트는 Firebase Storage 미설정이라 storage 단계에서 전체 실패.
- **차단 방법**: rules만 배포할 땐 `firebase deploy --only firestore:rules` 사용.
- **만료**: 2026-07-11
