---
allowed-tools: Agent, Read, Write, Edit, Bash(git status:*), Bash(git log:*), Bash(ls:*), Bash(git diff:*), Bash(git diff --name-only:*), Bash(git branch:*), Bash(curl:*)
description: 자동 — 팀장 에이전트 (완전 자율 개발 루프, 사람 개입 0회)
---

## Context

- 현재 브랜치: !`git branch --show-current`
- 활성 계획: !`ls docs/exec-plans/active/ 2>/dev/null | grep -v '\.gitkeep' || echo "(없음)"`
- 최근 커밋: !`git log --oneline -3`

## 팀장 에이전트 — 완전 자율 개발 루프

**목표**: 사람 개입 0회. 사용자의 아이디어 요청 → dev 배포 완료까지 완전 자동.

**가장 중요한 원칙**: 실수가 발생하면 즉시 `docs/references/active-lessons.md`에 패턴을 기록.
다음 에이전트 호출 시 자동으로 그 교훈이 주입되어 동일한 실수가 구조적으로 불가능해진다.

---

## STATUS BLOCK 파싱 규칙

각 에이전트 출력 끝의 아래 블록을 읽어 결과를 판단한다:
```
===AUTO_STATUS===
RESULT: SUCCESS|FAILURE|NEEDS_ESCALATION
PLAN_FILE: docs/exec-plans/active/{파일명}.md
TEST_PLAN_FILE: docs/test-plans/{기능명}.md  (테스터 전용)
BUGS: {숫자}
QUALITY_GRADE: 통과|조건부통과|미달|N/A
EXECUTED_ACTIONS: clicks={N}, inputs={N}, form_submits={N}, navigations={N}, creates={N}, updates={N}, deletes={N}  (테스터 전용)
CHECKLIST: {완료}/{전체}  (테스터 전용)
PART_A_SCANNED: {페이지명}={완료}/{전체},...  (테스터 전용)
NOTES: {파이프(|)와 세미콜론(;;)으로 구조화된 메타데이터}
===AUTO_STATUS_END===
```

**NOTES 파싱 규칙**:
- 최상위 필드 구분자: `|` · 복수 FIX/BUG 구분자: `;;` · FIX 파일-내용 구분자: `::`
- BUG 항목: `BUG-N={파일}|{증상}|{재현}`
- `ENV_REQUIRED=` 포함 → 즉시 에스컬레이션

**테스터 얕은 테스트 플래그 탐지** (테스터 결과 처리 시 우선 적용):
- NOTES에 `SHALLOW_TEST` → 테스터 재호출 (인터랙션 강제 프롬프트 재전달)
- NOTES에 `NO_TEST_PLAN`/`EMPTY_CHECKLIST` → 테스트 플랜 자동 생성 후 기획자 재호출로 체크리스트 채우기 → 테스터 재호출
- NOTES에 `INCOMPLETE_CHECKLIST` → 테스터 재호출 (미완료 항목만 실행)
- `CHECKLIST` < 100% 또는 `clicks + inputs + form_submits = 0` → `RESULT: SUCCESS`여도 **자동 FAILURE 강등** 후 재루프

---

## 컨텍스트 압축 게이트 (모든 Phase 공통)

다음 트리거 중 하나 만족 시 즉시 `docs/progress.md` 상단에 압축 블록 1개 추가 (Append-only):
컨텍스트 사용률 30% / 사이클 내 30분 / 작업 단계 10개 경과.
형식·복원 절차는 [`AGENTS.md` § 컨텍스트 압축 프로토콜](../../AGENTS.md). 압축 후에도 사람 개입 0회 유지.

---

## Phase -1: 명령 수신 확인 (Command Recognition Gate)

**실행 시작 전 최우선으로 수행한다.** AGENTS.md "명령 수신 확인 프로토콜" 형식으로 확인:

```
📌 명령 수신 확인

[명령]: /auto (완전 자율 개발)
[원본 지시]: {$ARGUMENTS 원문}

[작업 요약]:
1. {원본 지시에서 파악한 항목 1}
2. ...

[실행 범위]:
- 대상: {영향받는 페이지/기능}
- 브랜치: {현재 브랜치}
- 배포: dev 자동 배포까지 포함

[주의사항]: 컨펌 후 Phase 0~6 완전 자율 실행 (사람 개입 0회)

이 이해가 맞으면 "컨펌"으로 승인해주세요.
```

- 컨펌 후 **Phase 0부터 사람 개입 없이** 자동 진행
- `$ARGUMENTS` 원문을 `ORIGINAL_INSTRUCTION`으로 저장 (Phase 5.9 검증에 사용)

---

## Phase 0: 초기 상태 확인

**0-A: 브랜치 가드 (최우선)**
```bash
git branch --show-current
```
- 결과가 `main`가 아니면 → **즉시 에스컬레이션** (이후 단계 금지)

1. `docs/references/active-lessons.md` 읽기 (없으면 "활성 경고 없음")
2. `docs/exec-plans/active/` 기존 활성 계획 확인
3. 사용자 요청(`$ARGUMENTS`) 파악

이후 모든 단계는 **사람 개입 없이** 자동 진행한다.

---

## Phase 1: 기획 + 검증 (자동 사이클, 최대 3회)

**기획자 에이전트 호출**:
```
작업 요청: {$ARGUMENTS}

=== 활성 경고 목록 (반드시 계획에 반영) ===
{active-lessons.md 전체 내용}
=== 활성 경고 끝 ===

중요: 이 계획은 사람 검토 없이 즉시 구현된다.
수용 기준에 "어떤 URL에서 어떤 동작이 관찰되는지" 구체적으로 명시하라.
```

검증 실패 시: NOTES에서 `FIX-N` 파싱 → 기획자 재호출 → 재검증 → 3회 후도 실패 → **에스컬레이션**.

---

## Phase 2: 구현자 에이전트

```
구현할 계획: {PLAN_FILE}

=== 활성 경고 목록 ===
{active-lessons.md 내용}
=== 끝 ===

중요: 코드 작성 + 빌드 성공 후, 반드시 로컬 프리뷰를 띄우고
변경 관련 모든 뷰 페이지를 스크린샷 캡처하여 워딩/레이아웃/UI를 직접 검증하라.
비주얼 버그 발견 시 즉시 자가 수정.
```

`RESULT: FAILURE`/`NEEDS_ESCALATION` → 에스컬레이션.

---

## Phase 3: 로컬 품질 루프 (BUGS=0까지 반복, 최대 5회)

**루프 카운터**: `local_loop = 0`. 5회 초과 → 에스컬레이션.

### Step 3.1: 검토자 에이전트
`QUALITY_GRADE: 미달` 시 NOTES에서 `FIX-N={파일}::{내용}` 파싱 → 버그수정자 형식으로 변환 → **파일 충돌 그룹화** (같은 파일=직렬, 다른 파일=병렬) → 각 완료 후 3.1 재실행.
`QUALITY_GRADE: 통과|조건부통과` → Step 3.2.

### Step 3.2: 테스터 에이전트 (로컬)
테스트 플랜 파일 확보 (없으면 `_template.md` 복사 → 기획자 재호출로 체크리스트 채우기).
```
테스트 모드: LOCAL
테스트 URL: http://localhost:3000
테스트 계정: `.env.local` 의 TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD 참조
테스트 범위: {PLAN_FILE}의 수용 기준
TEST_PLAN_FILE: docs/test-plans/{기능명}.md
출력 필수: EXECUTED_ACTIONS, CHECKLIST, PART_A_SCANNED (누락·0이면 자동 FAILURE)

=== 활성 경고 목록 ===
{active-lessons.md 내용}
=== 끝 ===
```
**얕은 테스트 강등 규칙** (1순위): `clicks+inputs+form_submits=0` → SHALLOW_TEST 강등 / `CHECKLIST < 100%` → INCOMPLETE_CHECKLIST 강등 → 재호출.

`BUGS: 0` + `RESULT: SUCCESS` + 강등 규칙 통과 → **Phase 3 탈출** → Phase 3.5.
`BUGS > 0` → `BUG-N` 파싱 → 그룹화 → 버그수정자(들) 병렬 → 전원 완료 후 `npm run build` 1회 → active-lessons 추가 → `local_loop++` → 3.1로.

---

## Phase 3.5: 제품 품질 게이트 (1회)

로컬 품질 루프 클린 패스 후, 배포 전 마지막 제품 품질 검증. 테스터를 PQ 전용으로 호출:
PQ-1 UX흐름 / PQ-2 비주얼 / PQ-3 카피(EN/KO) / PQ-4 상태처리 / PQ-5 모바일(375px).
- `PQ 블로커 0건` → Phase 4
- `PQ 블로커 > 0건` → 버그수정자 → 빌드 → 1회 재실행 → 여전히 블로커 → 에스컬레이션
- `PQ 중요/경미만` → 기록, 배포 차단 안 함 → Phase 4

---

## Phase 4: 배포자 에이전트

```
PLAN_FILE: {PLAN_FILE}
브랜치: main
```
`git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force` 실행 + curl 헬스체크. `RESULT: FAILURE` → 에스컬레이션. SUCCESS → Phase 5.

---

## Phase 5: Dev 리사이클 루프 (BUGS=0까지 반복, 최대 3회)

**루프 카운터**: `dev_loop = 0`. 3회 초과 → 에스컬레이션.

### Step 5.1: 테스터 에이전트 (Dev)
```
테스트 모드: DEV
테스트 URL: https://withcomai-web.web.app
테스트 계정: `.env.local` 의 TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD 참조
테스트 범위: {PLAN_FILE}의 수용 기준
```
`BUGS: 0` + `RESULT: SUCCESS` → **Phase 5 탈출** → Phase 5.5.
`BUGS > 0` → `BUG-N` 파싱 → 그룹화 → 버그수정자 → 빌드 → 배포자 재호출(재배포) → `dev_loop++` → 5.1로.

---

## Phase 5.5: 전체 커버리지 테스트 (1회)

전체 애플리케이션 종합 테스트로 회귀·누락 버그 포착. **루프 카운터**: `full_loop = 0`. 2회 초과 → 에스컬레이션.
핵심 페이지에 PQ-1~PQ-5 실행 + 비용 최소화 지침(AI 생성 최소 입력 등).
`BUGS: 0` + PQ 블로커 0건 → Phase 5.9. 아니면 버그수정자 → 빌드 → 재배포 → 재실행.

---

## Phase 5.9: 원본 지시 검증

**Phase 6 호출 전 반드시 수행.** `verify_loop = 0`. 2회 초과 → 에스컬레이션.
`ORIGINAL_INSTRUCTION` 기준으로 AGENTS.md "원본 지시 검증 프로토콜" 형식 체크리스트 출력.
미충족 항목 → 구현자 재호출 → 검토자 → 테스터 → 배포자 축소 사이클 → `verify_loop++` → 재실행.
전체 충족 → Phase 6.

---

## Phase 6: 반영자 에이전트

```
PLAN_FILE: {PLAN_FILE}
```

---

## 하네스 건강 지표 기록 (모든 Phase 공통)

각 Phase 종료 시점에 `docs/metrics/harness-health.md` 표 맨 아래에 1행 append (Append-only):
```markdown
| YYYY-MM-DD HH:MM | /auto-P{N} | N | Y | Phase {N} 종료 / 상태 요약 |
```
STATUS BLOCK 위반 시 위반 컬럼에 `Y - {플래그}` 명시. 에스컬레이션 시 비고에 사유 명시.

---

## 최종 안내 (자동 출력)

```
✅ 자율 개발 완료

요청: {$ARGUMENTS}
계획: {계획명}
변경 파일: {N}개
버그 수정: {총 N}건 (로컬 N + Dev N + 전체커버리지 N)
소요 루프: 로컬 {N}회 / Dev {N}회 / 전체커버리지 {N}회

📊 제품 품질: PQ 블로커 0건 / 중요 {N}건 / 경미 {N}건

🔗 Dev 환경에서 바로 확인 가능: https://withcomai-web.web.app

📌 이번 사이클에서 학습된 패턴: {active-lessons에 새로 추가된 항목}

준비가 되면 "메인적용"으로 프로덕션 배포 진행.
```

---

## 에스컬레이션 — 즉시 중단 + 사용자 보고

발생 조건: Phase 1 기획+검증 3회 실패 / Phase 2 구현자 실패 / Phase 4 배포 실패 / Phase 3 로컬 루프 5회 초과 / Phase 5 Dev 루프 3회 초과 / Phase 3.5·5.5 게이트 미해결 / 버그수정자 NEEDS_ESCALATION(ENV_REQUIRED 포함).

```
⚠️ 자동 루프 에스컬레이션 — 직접 개입 필요

중단 지점: Phase {N}
원인: {NOTES 내용}
현재 변경 파일: {git diff --name-only HEAD}
```
