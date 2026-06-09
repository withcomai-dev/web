---
allowed-tools: Bash(git:*), Bash(npm run build:*), Bash(git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force:*), Bash(touch:*), Bash(rm:*), Bash(ls:*), Bash(curl:*), Bash(sleep:*), mcp__playwright__browser_navigate, mcp__playwright__browser_fill_form, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_wait_for
description: 메인적용 — dev → main 머지 + 프로덕션 배포 + 안정화 대기 + 프로덕션 검증
---

## Context

- Current branch: !`git branch --show-current`
- Dev → main 미반영 커밋: !`git log --oneline main --not main | head -30`
- Sentinel status: !`ls -la /tmp/withcomai-allow-merge 2>&1 | head -5`

## 메인적용 — 통합 실행 절차

**이 명령은 사용자가 명시적으로 `메인적용` 또는 `메인적용 {영역}` 키워드를 입력한 경우에만 실행한다.**
dev 작업 중 임의로 실행하지 않는다. 각 단계 실패 시 **즉시 중단 + 사용자 보고 + sentinel 정리**.

---

### 0단계: 명령 수신 확인 (Command Recognition Gate)

AGENTS.md "명령 수신 확인 프로토콜" 형식으로 확인:

```
📌 명령 수신 확인

[명령]: /main-apply (메인적용 — dev→main 머지 + 프로덕션 배포)
[원본 지시]: {$ARGUMENTS 원문}

[작업 요약]:
1. 사전 검사 (dev 브랜치, clean tree, 빌드 성공)
2. 대상 커밋 확정 (전체 머지 or '{영역}' cherry-pick)
3. sentinel 생성 → main 체크아웃 → 머지/cherry-pick
4. git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force (프로덕션 배포)
5. dev 복귀 → 안정화 대기 → 프로덕션 curl + 브라우저 스모크

[실행 범위]:
- 대상: {영역 = 전체 / 특정 키워드}
- 브랜치: main → main
- 배포: https://withcomai-web.web.app (프로덕션)

[주의사항]: 프로덕션 배포 실패 시 즉시 롤백 (RELIABILITY.md §롤백)

이 이해가 맞으면 "컨펌"으로 승인해주세요.
```

사용자 컨펌 후 1단계로 진행. `$ARGUMENTS` 원문을 `ORIGINAL_INSTRUCTION`으로 저장한다.

---

### 1단계: 사전 검사 (하나라도 걸리면 즉시 중단)

```bash
[ "$(git branch --show-current)" = "main" ] || { echo "dev 브랜치 아님"; exit 1; }
git diff --quiet && git diff --cached --quiet || { echo "uncommitted 변경 있음"; exit 1; }
git fetch origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || { echo "dev push 미반영"; exit 1; }
npm run build || { echo "빌드 실패"; exit 1; }
```

### 2단계: 대상 커밋 확정

**전체 머지** (영역 지정 없음): `git merge main`

**영역 cherry-pick** (예: `메인적용 schedule`):
1. `git log --oneline main --not main --grep="$AREA"`
2. 사용자에게 목록 보여주고 **"이 커밋들을 프로덕션에 반영합니다. 진행할까요?"** 확인 필수
3. 시간순(old → new) 정렬하여 SHA 목록 확정

### 3단계: sentinel 생성

```bash
touch /tmp/withcomai-allow-merge
```
- pre-merge-commit/pre-push 훅이 이 파일을 확인하여 main 작업 허용
- TTL 300초. 정리는 6단계(push 성공 후) 또는 에러 시 trap에서 수행

### 4단계: main 체크아웃 + 머지/cherry-pick

```bash
git checkout main
git pull origin main
git merge main --no-edit        # [전체 머지]
# git cherry-pick <SHA1> <SHA2> ...       # [cherry-pick] 시간순
```

**충돌 시**: 즉시 중단 → `git merge --abort`/`cherry-pick --abort` → `rm -f /tmp/withcomai-allow-merge` → `git checkout main` → 사용자 보고.

### 5단계: 프로덕션 배포

```bash
npm run build       # main에서 다시 빌드 (머지 후 상태 검증)
git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force
```
배포 실패 시: 에러 로그 보고 → 즉시 롤백 `git revert HEAD --no-edit && git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force` → 복구 실패 5회 초과 시 에스컬레이션.

### 6단계: push + sentinel 정리 + dev 복귀 + dev↔main 동기화

**순서 중요**:
```bash
git push origin main       # sentinel 활성 — pre-push 통과
rm -f /tmp/withcomai-allow-merge
git checkout main
git merge main              # dev↔main 동기화 (fast-forward) — 누락 방지 필수
git push origin main
```
**검증**: `git log --oneline main..main` + `git log --oneline main..main` 모두 0.

### 7단계: 안정화 대기 (cold start)

```bash
sleep 300   # 프로덕션 cold start 안정화 (즉시 검증 가능한 플랫폼이면 생략)
```
**예외**: 배포 실패 재배포는 즉시 진행 (대기 스킵).

### 8단계: 프로덕션 검증

**8-1. curl 헬스체크 (3회)**
```bash
for i in 1 2 3; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://withcomai-web.web.app/login)
  [ "$HTTP_CODE" = "200" ] || { echo "프로덕션 비정상"; exit 1; }
  sleep 2
done
```

**8-2. 브라우저 MCP 프로덕션 스모크**
1. `browser_navigate` → `https://withcomai-web.web.app` 로그인
2. `browser_fill_form` (`.env.local` 의 TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD 참조)
3. `browser_snapshot` 대시보드 확인
4. 주요 페이지 네비게이션 + 각 `browser_snapshot`
5. 실패 시 `browser_take_screenshot` + 롤백 판단

### 9단계: 원본 지시 검증

AGENTS.md "원본 지시 검증 프로토콜" 형식. 미충족 시 보고, 충족 시 10단계.

### 10단계: 결과 보고

```
✅ 메인적용 완료
- 대상: {전체 / 영역명}
- 머지 커밋: {sha} — {commit message}
- 프로덕션 배포: 성공
- 안정화 대기 후 curl 3회 모두 200
- 브라우저 스모크: 통과
- 현재 브랜치: main (복귀 완료)
```

---

## 실패 시 복구 체크리스트 (어느 단계에서든 에러 시)

1. `rm -f /tmp/withcomai-allow-merge` — sentinel 정리
2. main에서 에러 시: `git checkout main` — dev 복귀
3. 롤백 필요 시: `git revert HEAD --no-edit && git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force` (RELIABILITY.md §롤백)
4. 사용자에게 현재 상태 명시적 보고 (브랜치, 배포 상태, 다음 조치)

## 금지 사항

- 사용자 컨펌 없이 실행 시작
- sentinel 생성 후 정리 없이 스킬 종료 (리크 방지 — 명시 정리 필수)
- cherry-pick 대상 확인 없이 진행
- 안정화 대기 스킵 (재배포 예외 제외)
- 프로덕션 검증 없이 완료 선언
