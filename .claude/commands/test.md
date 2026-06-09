---
allowed-tools: Bash(npm run build:*), Bash(npm run dev:*), Bash(curl:*), Bash(ls:*), mcp__playwright__browser_navigate, mcp__playwright__browser_fill_form, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_wait_for, mcp__playwright__browser_console_messages, mcp__playwright__browser_type, mcp__playwright__browser_press_key
description: 테스트만 — 빌드 + 로컬 프리뷰 테스트 (커밋/배포 없음)
---

## Context

- 현재 브랜치: !`git branch --show-current`
- 변경 파일: !`git diff HEAD --stat`
- 활성 계획: !`ls docs/exec-plans/active/ 2>/dev/null | grep -v '\.gitkeep' || echo "(없음)"`

## 테스트 전용 실행 절차

커밋·푸시·배포 없이 **로컬 빌드 + 프리뷰 테스트만** 수행한다.

---

### 0단계: 명령 수신 확인 (Command Recognition Gate)

**1단계 시작 전 최우선으로 수행한다.** AGENTS.md "명령 수신 확인 프로토콜" 형식으로 확인:

```
📌 명령 수신 확인

[명령]: /test (로컬 테스트만)
[원본 지시]: {$ARGUMENTS 원문}

[작업 요약]:
1. {테스트할 기능 항목 1}
2. ...

[실행 범위]:
- 대상: {테스트 대상 기능/페이지}
- 브랜치: {현재 브랜치}
- 배포: 없음 (테스트만)

[주의사항]: {있으면 기재, 없으면 "없음"}

이 이해가 맞으면 "컨펌"으로 승인해주세요.
```

사용자 컨펌 후 1단계로 진행한다.

---

### 1단계: 빌드

```bash
npm run build
```

빌드 실패 시 **즉시 중단**, 에러 내용 보고.

### 2단계: 로컬 프리뷰 시작

```bash
npm run dev
```

Port 3000에서 프리뷰가 시작되는지 확인.

### 3단계: 테스트 범위 결정 + 테스트 플랜 게이트

**3-A. 테스트 범위 결정**
- 활성 실행 계획이 있으면 해당 계획의 수용 기준 + 연관 기능 회귀
- 없으면 사용자에게 테스트 범위 질문 (`기능명` 확정)

**3-B. 테스트 플랜 파일 게이트 (필수)**
```bash
FEATURE={기능명 슬러그}
test -f "docs/test-plans/${FEATURE}.md" && grep -c '^- \[ \]' "docs/test-plans/${FEATURE}.md"
```
- 파일 없음 → `cp docs/test-plans/_template.md docs/test-plans/${FEATURE}.md` 제안 후 **사용자가 실행 체크리스트 항목을 최소 1개 채우기 전까지 4단계 진입 금지**
- 파일 있고 체크박스 ≥ 1 → 4단계 진행
- **플랜 파일 없이는 얕은 테스트 위험**이므로 절대 우회 금지

---

### 4단계: 브라우저 MCP 테스트 (직접 실행 — 인터랙션 강제)

**테스트 URL**: `http://localhost:3000`
**테스트 계정**: `.env.local` 의 TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD 참조

#### 4-A. 실행 원칙 (SHALLOW_TEST 방지)

- `snapshot` 단독으로 "정상 렌더링 확인" 판정 **금지**
- 각 페이지에서 반드시 `click`·`type`·`fill_form`·`select_option` 중 하나 이상 실행
- 테스트 플랜의 `## 실행 체크리스트 (필수)` 각 `- [ ]` 항목을 **직접 실행**하여 `✅/❌/N/A` 판정
- 각 MCP 호출 후 카운터를 카테고리별 누적: `clicks`, `inputs`, `form_submits`, `navigations`, `select_changes`, `creates`, `updates`, `deletes`
- 외부 연동: 사용자에게 가능 여부 질문, "패스" 시 건너뜀 (해당 항목 `N/A`)

#### 4-B. 페이지당 최소 인터랙션 임계 (하한선)

- 기능 페이지(폼·버튼): `clicks ≥ 2 AND (inputs ≥ 1 OR form_submits ≥ 1)`
- 정보 페이지: `clicks ≥ 1 AND navigations ≥ 1`
- 미달 페이지는 `SHALLOW_PAGES` 목록에 기재. 3개 이상이면 테스트 불합격

#### 4-C. 버그·이슈 기록

- 버그 발견 시 `take_screenshot` 캡처 후 `docs/references/active-lessons.md`에 패턴 즉시 기록
- PQ 이슈는 `PQ-{N}={URL}|{카테고리}|{문제}|{심각도}` 형식으로 최종 보고에 포함

---

### 4.5단계: 제품 품질 빠른 확인

**PQ-Quick-1: 카피 검증** — 라벨/버튼 텍스트가 기능 문맥에 맞는지, 언어 토글 양쪽 자연스러운지
**PQ-Quick-2: 상태 처리** — 빈 상태 안내, 로딩 인디케이터 존재 확인
**PQ-Quick-3: 데모 준비** — 깨진 레이아웃·오탈자·미완성 UI 없는지

결과: 3개 통과 → 5단계. 불합격 → 수정 → 빌드 → 4.5단계만 재실행 (최대 2회). PQ 문제는 BUG와 동등하게 수정 사이클을 트리거한다.

---

### 5단계: 결과 보고

```
🧪 테스트 완료
- 빌드: 성공/실패
- 프리뷰: localhost:3000 — 정상/실패
- 테스트 범위: {테스트한 기능 목록}
- 테스트 플랜: docs/test-plans/{기능명}.md
- 실행 체크리스트: {완료}/{전체} (100% 미달 시 자동 불합격)
- EXECUTED_ACTIONS: clicks={N}, inputs={N}, form_submits={N}, navigations={N}, ...
- SHALLOW_PAGES: {없음 / 페이지명}
- 발견 버그: {N}건
- 제품 품질 이슈: {N}건 ({블로커}B / {중요}M / {경미}L)
- 하네스 지표: docs/metrics/harness-health.md 1행 기록 완료
```

**기록 의무**: 결과 보고 직후 `docs/metrics/harness-health.md` 표 맨 아래에 1행 append:

```markdown
| YYYY-MM-DD HH:MM | /test | N | Y | {한줄 요약} |
```

---

**자동 실격 조건** (하나라도 해당되면 "✅ 클린 패스" 선언 금지):
- `clicks + inputs + form_submits = 0` → SHALLOW_TEST, 4단계 재실행
- 테스트 플랜 파일 없음 → NO_TEST_PLAN, 3-B 게이트로 복귀
- 실행 체크리스트 완료율 < 100% → INCOMPLETE_CHECKLIST, 미완료 항목 실행 후 재보고
- SHALLOW_PAGES ≥ 3개 → 페이지별 인터랙션 추가 후 재보고

버그 발견 시 수정 → 빌드 → 재테스트 사이클을 클린 패스까지 반복한다.
