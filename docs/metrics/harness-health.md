# 하네스 건강 지표 (Harness Health)

> AI 에이전트 하네스(헌법·명령·메모리·평가)의 정량 지표를 누적하는 **단일 원천**.
> 매 명령 실행 후 1행씩 append. 행은 수정 금지(Append-only).

---

## 사용 목적

- **하네스 자체의 회귀 추적** — STATUS BLOCK 4대 강제장치 위반율, 명령별 성공률, E2E 통과율
- **개선 효과 측정** — 하네스 변경 전후 비교
- **주간 회고 자료** — `/reflect` 시 1회 집계 → `lessons.md`에 1줄 기록

---

## 컬럼 정의

| 컬럼 | 의미 | 예시 |
|------|------|------|
| 일시 | 작업 종료 시점 | `2026-05-13 21:00` |
| 명령 | 실행된 명령명 (Phase 접미사 가능) | `/tcp` · `/test` · `/auto-P5` |
| STATUS BLOCK 위반 | 테스터 4대 강제장치 위반 여부 + 사유 | `N` 또는 `Y - SHALLOW_TEST` |
| 성공 | 명령이 최종 SUCCESS로 끝났는지 | `Y` 또는 `N` |
| E2E 통과율 | 시나리오 통과 / 전체 (해당 시) | `12/12` 또는 `N/A` |
| SHALLOW_TEST % | `clicks+inputs+form_submits=0` 발생 비율 | `0%` 또는 `25%` |
| 비고 | 자유 텍스트 (페이지 수, 버그 N건, 에스컬레이션 사유) | `카드뉴스 트랙` |

---

## 기록 가이드라인

| 명령 | 기록 시점 | 추가 행 수 |
|------|---------|--------------|
| `/tcp` | 결과 보고 직후 | 1행 |
| `/test` | 결과 보고 직후 | 1행 |
| `/auto` | 각 Phase 종료 시점 (또는 에스컬레이션) | 1 사이클당 최대 ~7행 |
| `/implement` · `/plan` · `/review` · `/reflect` · `/main-apply` | 필요 시 | 0~1행 |

위반 플래그: `SHALLOW_TEST` · `NO_TEST_PLAN` · `EMPTY_CHECKLIST` · `INCOMPLETE_CHECKLIST` · `SHALLOW_PAGES`

행이 1000개 넘으면 `harness-health-{YYYY}q{N}.md`로 분기, 헤더 복사 후 본 파일 archive.

---

## 지표 표

| 일시 | 명령 | STATUS BLOCK 위반 | 성공 | E2E 통과율 | SHALLOW_TEST % | 비고 |
|------|------|------------------|------|-----------|----------------|------|
| YYYY-MM-DD | /read | N | Y | N/A | N/A | 하네스 도입 baseline |
| 2026-06-11 13:10 | /tcp | N | Y | 42/42 (셀렉터 오류 2건 수정 후 재검증 통과) | 0% | 2차 요청사항 6건 — 로컬+web.app E2E, 어드민 CRUD·문의 제출 실행, 롤아웃 SUCCEEDED, 마이그레이션 1건 반영 |
