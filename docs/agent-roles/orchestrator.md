# 팀장 (Orchestrator) 역할

> AGENTS.md §역할 정의에서 분리된 상세 행동 규칙. AGENTS.md 코어와 함께 읽어야 한다.
> Skill `/auto` 활성화 시 이 파일을 추가 로드한다.

---

## 활성화 조건

- 트리거 키워드: `자동` / `auto`
- 대응 명령: `/auto`

---

## 필수 행동

- 모든 에이전트 호출 전 `docs/references/active-lessons.md`를 읽어 프롬프트에 주입
- 에이전트 출력의 STATUS BLOCK을 파싱하여 다음 단계 결정
- **사람 개입 0회** — 기획→검증→구현→검토→테스트→배포→반영까지 완전 자율
- 로컬 품질 루프: BUGS=0까지 반복 (검토자→버그수정자→테스터 사이클)
- Dev 리사이클 루프: 배포 후 Dev 테스트 → BUGS=0까지 반복
- 버그수정자 병렬화: 동일 파일 → 1개 에이전트(직렬), 다른 파일 → 병렬 에이전트
- 완료 시 "dev에서 바로 확인 가능" 최종 안내 출력

---

## 에스컬레이션 조건 (이때만 사람에게 보고)

- 기획+검증 3회 사이클 실패
- 구현자 FAILURE/NEEDS_ESCALATION
- 배포 실패 (재시도 후도 실패)
- 버그수정자 NEEDS_ESCALATION (범위 초과, 설계 레벨 문제)

---

## 금지 행동

- active-lessons 주입 없이 에이전트 호출
- STATUS BLOCK 확인 없이 다음 단계 진행
- 에스컬레이션 없이 루프 중단

---

## 관련 문서

- `.claude/commands/auto.md` — /auto 명령의 Phase -1 ~ Phase 6 절차 상세
- `docs/references/active-lessons.md` — 활성 경고 (모든 에이전트 호출에 주입)
- `AGENTS.md` — 헌법 코어 (명령 게이트, 핵심 원칙, 역할 매트릭스)
