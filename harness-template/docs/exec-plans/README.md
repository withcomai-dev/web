# docs/exec-plans — 실행 계획 라이프사이클

> 기획자(`/plan`)가 작성하는 실행 계획(Sprint Contract)의 보관소.
> 계획은 상태에 따라 디렉토리를 이동한다.

## 디렉토리

| 디렉토리 | 의미 |
|----------|------|
| `active/` | 진행 중인 계획 (승인됨 / 구현중) |
| `completed/` | 완료된 계획 (반영자가 이동) |
| `archive/` | 보류·취소된 계획 |
| `templates/` | 플랜 작성 템플릿 |

## 라이프사이클

```
/plan 작성 → active/{task}.md (상태: 기획중)
  → 사용자 승인 → 상태: 승인됨
  → /implement → 상태: 진행중 → 구현완료
  → /tcp 또는 /test 클린 패스
  → /reflect → git mv active/ → completed/ (상태: 완료)
```

## 파일명 규칙

- 영어 kebab-case: `add-user-export.md`, `fix-billing-race.md`
- 템플릿: `templates/sprint-contract.md` 복사

## 관련 문서

- `templates/sprint-contract.md` — 플랜 템플릿 (Phase A 제품검증 + Phase B 기술명세)
- `templates/external-review-prompt.md` — 외부 LLM 크로스리뷰 프롬프트 (선택)
- `docs/agent-roles/planner.md` — 기획자 역할 규칙
