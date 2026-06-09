---
allowed-tools: Bash(npm run build:*), Bash(git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force:*), Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*), Bash(git diff:*), Bash(git log:*), Bash(curl:*), mcp__playwright__browser_navigate, mcp__playwright__browser_fill_form, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_wait_for, mcp__playwright__browser_console_messages
description: 테커푸 — 빌드 → E2E 테스트 → 커밋 → 푸시 → 배포 → Dev 검증
---

## Context

- Current git status: !`git status`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -5`

## 테커푸 (tcp) — 통합 실행 절차

아래 단계를 **순서대로** 실행하라. 각 단계 실패 시 **즉시 중단**하고 에러를 보고하라.

### 0단계: 명령 수신 확인 (Command Recognition Gate)

**1단계 시작 전 최우선으로 수행한다.** AGENTS.md "명령 수신 확인 프로토콜" 형식으로 확인:

```
📌 명령 수신 확인

[명령]: /tcp (테커푸 — 빌드→테스트→커밋→푸시→배포)
[원본 지시]: {$ARGUMENTS 원문}

[작업 요약]:
1. {구체적 작업 항목 1}
2. ...

[실행 범위]:
- 대상: {영향받는 기능}
- 브랜치: {현재 브랜치}
- 배포: dev 배포 포함

[주의사항]: {있으면 기재, 없으면 "없음"}

이 이해가 맞으면 "컨펌"으로 승인해주세요.
```

사용자 컨펌 후 1단계로 진행. `$ARGUMENTS` 원문을 `ORIGINAL_INSTRUCTION`으로 저장한다.

---

### 1단계: 빌드 (타입체크 포함)

```bash
npm run build
```
- 빌드 실패 시 **즉시 중단**, 에러 내용 보고

### 2단계: E2E 테스트 (브라우저 MCP — 인터랙션 강제)

브라우저 MCP로 실제 사용자 시나리오를 테스트한다. **스냅샷만으로 "정상 확인" 판정 금지**.

**테스트 계정:** URL `http://localhost:3000` · `.env.local` 의 TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD 참조

#### 2-A. 테스트 플랜 게이트 (필수)

`0단계`에서 파악한 기능명 슬러그 확정(`FEATURE`).
```bash
test -f "docs/test-plans/${FEATURE}.md" && grep -c '^- \[ \]' "docs/test-plans/${FEATURE}.md"
```
- 파일 없음 또는 체크박스 0개 → `cp docs/test-plans/_template.md docs/test-plans/${FEATURE}.md` 후 실행 체크리스트 작성 요청. 작성 완료 전까지 2-B 진행 금지.

#### 2-B. 로그인 + 실행 체크리스트 수행

1. `browser_navigate` → 로그인 → 대시보드 로딩 확인
2. **테스트 플랜의 `## 실행 체크리스트 (필수)` 각 `- [ ]` 항목을 직접 실행** (각 항목은 `click`·`type`·`fill_form`·`select_option` 중 하나 이상 수반, `✅/❌/N/A` 판정)
3. **MCP 액션 카운터 누적** (필수): 모든 호출을 카테고리별 카운트

#### 2-C. 자동 실격 조건 (하나라도 해당 → 클린 패스 불가)

- 테스트 플랜 파일 없음/체크박스 0개 → `NO_TEST_PLAN` / `EMPTY_CHECKLIST`
- `clicks + inputs + form_submits = 0` → `SHALLOW_TEST`
- 실행 체크리스트 완료율 < 100% → `INCOMPLETE_CHECKLIST`
- 페이지당 최소 임계 미달 페이지 3개 이상 → `SHALLOW_PAGES` FAILURE
  - 기능 페이지: `clicks ≥ 2 AND (inputs ≥ 1 OR form_submits ≥ 1)`
  - 정보 페이지: `clicks ≥ 1 AND navigations ≥ 1`

#### 2-D. 실패 시 처리

- 테스트 실패 시 **즉시 중단**, `take_screenshot` 캡처 후 `docs/references/active-lessons.md`에 패턴 기록 + 사용자 보고

### 2.5단계: 빠른 제품 품질 확인

**PQ-Quick-1 카피** / **PQ-Quick-2 상태 처리** / **PQ-Quick-3 데모 준비** (test.md 4.5단계와 동일).
3개 통과 → 3단계. 불합격 → 수정 → 빌드 → 2.5단계만 재실행 (최대 2회).

---

### 3단계: 커밋 & 푸시

변경사항이 있을 경우에만 실행.

1. `git add`로 변경 파일 스테이징 (민감 파일 `.env` 등 제외)
2. 변경 내용 분석하여 커밋 메시지 자동 생성 (`feat:` / `fix:` / `refactor:` / `style:`)
3. `git commit`
4. `git push origin HEAD`

### 4단계: 배포

현재 브랜치 확인 후 배포 명령 선택:
- **`main` 브랜치**: `git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force`
- **`main` 브랜치**: `git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force`
- **기타 브랜치**: 배포 중단, 사용자에게 보고

배포 실패 시 **즉시 중단**, 에러 내용 보고.

### 5단계: Dev 환경 검증

배포 완료 후 **즉시** Dev 환경을 검증한다 (대기 없음).

**5-1. curl 헬스체크 (3회)**
```bash
curl -s -o /dev/null -w "%{http_code}" https://withcomai-web.web.app/login
```
- 3회 모두 200 확인 (cold start 포함)

**5-2. 브라우저 MCP Dev 테스트**
1. `browser_navigate` → `https://withcomai-web.web.app` 로그인 페이지
2. `browser_fill_form` 테스트 계정 로그인 (`.env.local` 의 TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD 참조)
3. `browser_snapshot` 대시보드 정상 로딩 확인
4. 주요 페이지 네비게이션 테스트 + 각 페이지 `browser_snapshot`
5. 실패 시 `browser_take_screenshot` + 에러 보고

> **main 브랜치인 경우**: Dev 검증 후 Production URL(https://withcomai-web.web.app)도 안정화 대기 후 동일 검증.

### 5.5단계: 원본 지시 검증

0단계의 `ORIGINAL_INSTRUCTION` 기준으로 AGENTS.md "원본 지시 검증 프로토콜" 형식 출력. 미충족 시 보고, 전체 충족 시 6단계.

### 6단계: 품질 기록

활성 실행 계획이 있으면 `docs/QUALITY_SCORE.md` 간략 점검 후 계획 파일 `## 품질 평가 결과` 섹션에 기록.

### 6.5단계: 하네스 건강 지표 기록

`docs/metrics/harness-health.md` 표 맨 아래에 1행 append (Append-only):
```markdown
| YYYY-MM-DD HH:MM | /tcp | N | Y | {한줄 요약} |
```
위반 시: `| ... | /tcp | Y - SHALLOW_TEST | N | clicks+inputs+form_submits=0 |`

---

### 결과 보고

```
✅ 테커푸 완료
- 빌드: 성공
- E2E 테스트: 통과
- 실행 체크리스트: {완료}/{전체}
- EXECUTED_ACTIONS: clicks={N}, inputs={N}, form_submits={N}, ...
- SHALLOW_PAGES: {없음 / 페이지명}
- 커밋: [해시] [메시지]
- 푸시: origin/[브랜치명]
- 배포: 성공
- 원본 지시 검증: 전체 충족
- Dev 검증: 모든 페이지 정상 + 인터랙션 임계 통과
```
