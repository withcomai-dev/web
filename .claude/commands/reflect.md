---
description: 반영 — 작업 완료 후 교훈 추출 및 하네스 개선
---

## Context

- 최근 커밋 5개: !`git log --oneline -5`
- 활성 계획: !`ls docs/exec-plans/active/ 2>/dev/null | grep -v '\.gitkeep' || echo "(없음)"`
- 기존 교훈 (최근): !`tail -40 docs/references/lessons.md`

## 반영 절차

`AGENTS.md`의 반영 프로토콜(Reflect Protocol)을 따른다.

### 사전 확인: 명령 수신 확인 (Command Recognition Gate)

**최우선으로 수행한다.** AGENTS.md "명령 수신 확인 프로토콜" 형식으로 확인:

```
📌 명령 수신 확인

[명령]: /reflect (반영)
[원본 지시]: {$ARGUMENTS 원문 또는 "최근 작업 반영"}

[작업 요약]:
1. {반영할 작업/세션 1}
2. 교훈 추출 + 문서 동기화

[실행 범위]:
- 대상: {반영 대상 계획/세션}
- 브랜치: {현재 브랜치}
- 배포: 없음

[주의사항]: {있으면 기재, 없으면 "없음"}

이 이해가 맞으면 "컨펌"으로 승인해주세요.
```

사용자 컨펌 후 아래 절차로 진행한다.

### 1. 교훈 추출

최근 작업을 분석하여 교훈을 식별한다:
- 예상과 다르게 작동한 것
- 시간이 많이 소요된 것
- 반복된 실수 패턴
- 새로 발견한 런타임 / 외부 API 제약

### 2. 교훈 기록

`docs/references/lessons.md`에 아래 형식으로 추가:

```markdown
### {YYYY-MM-DD} | {카테고리} | {한줄 요약}
- **상황**: 무엇이 일어났는가
- **원인**: 왜 일어났는가
- **해결**: 어떻게 해결했는가
- **교훈**: 다음에 어떻게 예방하는가
- **적용**: 어떤 문서/규칙에 반영해야 하는가
```

### 3. 승격 판단

- 동일 유형 교훈이 2회 이상 → 해당 문서에 규칙으로 승격
- 보안·안정성 관련이면 → 1회라도 즉시 승격

승격 대상: 코딩 규칙 → `CLAUDE.md`/`docs/agent.md` · 배포 → `RELIABILITY.md` · 보안 → `SECURITY.md` · 에이전트 행동 → `AGENTS.md`

### 4. 실행 계획 정리

활성 실행 계획이 완료된 경우:
1. `docs/exec-plans/active/{파일}.md` → `docs/exec-plans/completed/{파일}.md` 이동 (git mv)
2. `docs/progress.md` 해당 항목 업데이트
3. **상태 동기화 확인** — 실행 계획 디렉토리 위치와 실제 완료 상태 일치 확인. 불일치 시 `git log`로 검증 후 수정

### 5. 하네스 개선

반복 누락 항목이 있으면:
- Sprint contract 템플릿 업데이트 → `docs/exec-plans/templates/sprint-contract.md`
- 품질 체크리스트 업데이트 → `docs/QUALITY_SCORE.md`
- 스킬 이력 기록 → `docs/references/skill-evolution.md`

### 보고 형식

```
🔄 반영 완료
- 교훈 기록: {N}개
- 규칙 승격: {N}개 → {문서명}
- 실행 계획: {완료됨 / 없음}
- 하네스 개선: {있음 / 없음}
```
