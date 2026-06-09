# 테스트 플랜: {기능명}

> 테스터(`/test`, `/tcp`)의 **4대 강제장치 1번** — 이 파일이 없거나 `## 실행 체크리스트 (필수)`
> 섹션에 `- [ ]` 항목이 0개면 테스트는 자동 실격(`NO_TEST_PLAN`/`EMPTY_CHECKLIST`).

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| 기능명 | {기능명} |
| 테스트 URL | http://localhost:3000 (로컬) / https://withcomai-web.web.app (dev) |
| 테스트 계정 | `.env.local` 의 TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD 참조 (로컬) / `.env.local` 의 TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD 참조 (dev) |
| 관련 계획 | docs/exec-plans/active/{작업명}.md |
| 최종 실행 | {YYYY-MM-DD} |

---

## 실행 체크리스트 (필수)

> 각 항목은 **직접 실행**(click·type·fill_form·select_option 중 하나 이상)하고 `✅/❌/N/A` 판정.
> 스냅샷만 보고 통과 처리 금지.

- [ ] {페이지/기능}에서 {구체적 동작}을 수행하면 {기대 결과}가 나타난다
- [ ] {입력 폼}에 {값}을 입력하고 제출하면 {DB 저장/토스트/리다이렉트}가 발생한다
- [ ] {빈 상태}일 때 안내 메시지 + CTA가 표시된다
- [ ] {에러 상황}을 유발하면 사용자 친화적 에러 메시지가 표시된다
- [ ] 375px 모바일 뷰에서 레이아웃이 깨지지 않는다

---

## 제품 품질 평가 (PQ-1~PQ-5)

- [ ] PQ-1 UX 흐름: 처음 사용자 관점에서 전체 흐름이 자연스러운가
- [ ] PQ-2 비주얼: 정렬·간격·계층이 정돈되어 있는가
- [ ] PQ-3 카피: 라벨/버튼/에러가 자연스럽고 양쪽 언어 정상인가
- [ ] PQ-4 상태처리: 빈/로딩/에러 상태가 모두 처리되는가
- [ ] PQ-5 모바일: 핵심 페이지가 375px에서 사용 가능한가

---

## 실행 결과 (테스트 후 기록)

- 실행 체크리스트: {완료}/{전체}
- EXECUTED_ACTIONS: clicks={N}, inputs={N}, form_submits={N}, navigations={N}, ...
- SHALLOW_PAGES: {없음 / 페이지명}
- 발견 버그: {N}건
  - [BUG-1] {설명}
- PQ 이슈: {블로커}B / {중요}M / {경미}L
- 결과: 클린 패스 / 재테스트 필요
