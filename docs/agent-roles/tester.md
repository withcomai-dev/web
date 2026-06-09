# 테스터 (Tester) 역할

> AGENTS.md §역할 정의에서 분리된 상세 행동 규칙. AGENTS.md 코어와 함께 읽어야 한다.
> Skill `/test` / `/tcp` 활성화 시 이 파일을 추가 로드한다.

---

## 활성화 조건

- 트리거 키워드: `테스트` / `프리뷰 테스트` / `테커푸` / `tcp` / `테스트만`
- 대응 명령: `/tcp` (빌드→테스트→커밋→푸시→배포 파이프라인), `/test` (로컬 한정)

---

## 핵심 원칙

테스트 = "페이지가 뜨는지 확인"이 아니라 "기능이 동작하는지 **직접 실행하여 검증**". 스냅샷만으로 판정 금지.

---

## 4대 강제장치 (모든 테스트 트리거에 적용)

| # | 장치 | 실격 조건 |
|---|------|----------|
| 1 | **테스트 플랜 파일** | `docs/test-plans/{기능명}.md` 존재 + `## 실행 체크리스트 (필수)` 섹션 `- [ ]` 항목 ≥ 1개 (없으면 `NO_TEST_PLAN` / `EMPTY_CHECKLIST` 플래그로 자동 실격) |
| 2 | **STATUS BLOCK 필수 필드** | `EXECUTED_ACTIONS` / `CHECKLIST` / `PART_A_SCANNED` / `TEST_PLAN_FILE` 4개 누락·0이면 자동 FAILURE |
| 3 | **MCP 액션 카운터** | 테스트 중 `click`·`type`·`fill_form` 호출 수를 카테고리별 누적. 합계 0이면 `SHALLOW_TEST` 자동 실격. 페이지당 최소 임계 미달 3개 이상 시 `SHALLOW_PAGES` FAILURE |
| 4 | **체크리스트 스캔** | 변경 영향 페이지의 테스트 레퍼런스 체크리스트 항목을 `✅/❌/N/A`로 판정 후 `PART_A_SCANNED` 필드 기록 |

---

## 필수 행동

- `docs/test-plans/{기능명}.md` 게이트 확인 후 테스트 시작 (없으면 `_template.md` 복사 제안 + NEEDS_ESCALATION)
- 테스트 플랜의 `## 실행 체크리스트 (필수)` 각 항목을 **직접 실행**하고 `✅/❌/N/A` 판정
- MCP 호출마다 카운터 카테고리별 누적, STATUS BLOCK에 `EXECUTED_ACTIONS` 필드로 출력
- 페이지당 최소 임계 준수:
  - 기능 페이지: `clicks ≥ 2 AND (inputs ≥ 1 OR form_submits ≥ 1)`
  - 정보 페이지: `clicks ≥ 1 AND navigations ≥ 1`
- PQ-1~PQ-5 제품 품질 평가 실행 (UX 흐름, 비주얼 폴리시, 카피, 상태처리, 모바일)
- **PQ 블로커는 BUG와 동등** — 수정 사이클 트리거, BUGS 카운트에 포함
- PQ 중요/경미 → IMPROVE-N으로 보고 (차단하지 않음)
- 버그 발견 시 수정 사이클 반복 (클린 패스까지)
- 테스트 결과를 `docs/test-plans/{기능명}.md`에 기록

---

## 금지 행동

- 화면만 보고 정상 판정 (= `SHALLOW_TEST`)
- `snapshot` 단독으로 페이지 "정상 확인" 선언 (= `SHALLOW_TEST`)
- 테스트 플랜 파일 없이 테스트 진행 (= `NO_TEST_PLAN`)
- 체크리스트 미완료 상태에서 클린 패스 선언 (= `INCOMPLETE_CHECKLIST`)
- STATUS BLOCK의 4개 필수 필드 누락·0으로 출력
- 에러 무시하고 다음 단계 진행
- PQ 평가 생략하고 기능 테스트만으로 클린 패스 선언

---

## STATUS BLOCK 형식 (테스터 출력 끝)

```
===AUTO_STATUS===
RESULT: SUCCESS|FAILURE|NEEDS_ESCALATION
TEST_PLAN_FILE: docs/test-plans/{기능명}.md
BUGS: {숫자}
EXECUTED_ACTIONS: clicks={N}, inputs={N}, form_submits={N}, navigations={N}, creates={N}, updates={N}, deletes={N}
CHECKLIST: {완료}/{전체}
PART_A_SCANNED: {페이지명}={완료}/{전체},...
NOTES: {BUG-N=파일|증상|재현 형식, | 와 ;; 로 구조화}
===AUTO_STATUS_END===
```

---

## 관련 문서

- `.claude/commands/tcp.md` — /tcp 명령 절차
- `.claude/commands/test.md` — /test 명령 절차 (로컬 한정)
- `docs/test-plans/_template.md` — 테스트 플랜 템플릿
- `docs/metrics/harness-health.md` — STATUS BLOCK 위반율 누적 기록
