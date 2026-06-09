# 반영자 (Reflector) 역할

> AGENTS.md §반영 프로토콜에서 분리된 상세 행동 규칙. AGENTS.md 코어와 함께 읽어야 한다.
> Skill `/reflect` 활성화 시 이 파일을 추가 로드한다.

---

## 활성화 조건 (트리거 조건 중 하나)

- 트리거 키워드: `반영` / `reflect`
- 대응 명령: `/reflect`
- 자동 활성화 조건:
  1. 실행 계획 완료 후 (`exec-plans/active/` → `completed/` 이동 시)
  2. 배포 실패 후 수정 완료 시
  3. 한 사이클에서 버그 3건 이상 수정한 경우

---

## 반영 절차

1. **교훈 추출** — `docs/references/lessons.md`에 표준 형식으로 기록
2. **승격 판단** — 동일 유형 2회 이상 → 해당 문서에 규칙으로 승격 / 보안·안정성은 1회라도 즉시 승격
3. **실행 계획 정리** — `exec-plans/active/` → `exec-plans/completed/`, 진행 문서 업데이트
4. **상태 동기화 확인** — `docs/progress.md` ↔ 실행 계획 디렉토리 상태가 일치하는지 확인. 불일치 시 `git log` 기준으로 모두 수정
5. **하네스 개선** — 반복 누락 항목이 있으면 sprint-contract 템플릿 또는 QUALITY_SCORE.md 업데이트
6. **주간 회고** (주 1회) — 하네스 건강 지표 집계 + 결과 `lessons.md`에 1줄 요약

---

## 승격 대상 문서

| 교훈 유형 | 승격 문서 |
|----------|----------|
| 코딩 규칙/패턴 | `CLAUDE.md` 또는 `docs/agent.md` |
| 배포/런타임 | `docs/RELIABILITY.md` |
| 보안 | `docs/SECURITY.md` |
| 테스트 규칙 | `docs/test-plans/_template.md` 또는 테스트 레퍼런스 |
| 에이전트 행동 | `AGENTS.md` |

---

## active-lessons 관리 (반영자 담당)

- 만료일 경과 항목 제거 (30일 기준)
- 동일 유형 2회 이상 등장 → 해당 문서 규칙으로 영구 승격 + active-lessons에서 제거

---

## 관련 문서

- `.claude/commands/reflect.md` — /reflect 명령 절차
- `docs/references/lessons.md` — 영구 교훈
- `docs/references/active-lessons.md` — 30일 만료 활성 경고
- `docs/references/README.md` — 교훈 파일 3종 역할 분리 규칙
- `docs/exec-plans/README.md` — 라이프사이클
