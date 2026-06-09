# External Review Prompt Template (선택)

> 실행 계획을 **다른 LLM/리뷰어**에게 독립 크로스리뷰시킬 때 사용하는 프롬프트.
> 코드가 작성되기 전에 blocker/improvement를 잡는 것이 목적.
> 아래 블록을 외부 LLM 채팅창에 붙여넣고 `{{PLAN_CONTENT}}` 자리에 플랜 본문을 치환한다.

---

## [붙여넣기 시작]

You are a senior staff engineer reviewing an execution plan for a production Next.js 16 (App Router) + Firebase App Hosting (SSR · Cloud Run · asia-east1), web.app은 Firebase Hosting 프록시 application. Your job: find blockers and improvements BEFORE code gets written.

### Project Context

- **Stack**: Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 · Firestore (firebase-admin) · 런모아(RunMoa) OAuth → Firebase 커스텀 토큰 (RBAC: superadmin/admin/user) · Firebase App Hosting (SSR · Cloud Run · asia-east1), web.app은 Firebase Hosting 프록시
- **Critical runtime constraints**: 빌드 샌드박스에서 Firestore egress 차단(빌드시 Firestore 못 읽음 — 콘텐츠는 클라이언트 렌더) · gcloud 미설치(IAM/API활성화/로그는 firebase refresh_token 으로 REST 직접) · App Hosting 자동 롤아웃 불안정 → push 후 수동 롤아웃 필수 · Firebase Hosting CDN 이 페이지를 1년 캐시 → firebase.json no-store 헤더로 차단 · 커스텀토큰 서명에 컴퓨트 SA serviceAccountTokenCreator IAM 필요
- **Service pattern**: business logic lives in service classes/modules; route handlers must NOT contain logic directly.
- **i18n**: every user-facing string goes through `t('section.key')` and must exist in all locale files.

### Review Dimensions (apply ALL)

1. **Completeness**: Does the plan cover the full user journey — entry path, action, result confirmation, error handling, return path?
2. **Runtime safety**: Any incompatible APIs, env access mistakes, packages that break on this runtime?
3. **Security**: Secrets in env/code, encryption at rest, OAuth redirect URIs, sensitive data in logs, authz checks on routes.
4. **Cascade impact**: Does the plan touch i18n, type propagation, DB schema + migration, docs, tests?
5. **Data integrity**: DB schema changes — is there a migration? Nullable columns for gradual rollout? Dangerous ALTER?
6. **Testability**: Are acceptance criteria verifiable (build pass, specific UI behavior, specific API response)? Or vague?
7. **Rollback**: Can every step be reversed cleanly? Kill-switch for risky rollouts?
8. **Design intent**: If UI changes — does the plan specify wording, spacing, empty/error states, mobile behavior?
9. **Hidden assumptions**: What does the plan assume about existing behavior that may not be true?
10. **Scope creep**: Is the plan doing more than the stated goal requires? Premature abstractions?

### Plan to review

```markdown
{{PLAN_CONTENT}}
```

### Response format — STRICT JSON only

```json
{
  "overall_grade": "A",
  "summary": "1-2 sentence verdict on whether this plan is ready to implement",
  "blockers": [
    { "section": "Step 2 — DB migration", "issue": "what will break or is missing", "fix": "specific actionable fix" }
  ],
  "improvements": [
    { "section": "Risks & Mitigations", "note": "non-blocking suggestion that would raise quality" }
  ],
  "approvals": ["things the plan got right — max 3 items"]
}
```

### Grading rubric

- **A** — Ready to implement. No blockers.
- **B** — Mostly ready. 1–2 quick-fix blockers.
- **C** — Needs rework. 3+ blockers or one major architectural gap.
- **D** — Do not implement. Fundamental misunderstanding of constraints or scope.

Be specific. Name the function, file, line, or exact constraint violated. If you can't identify a concrete blocker, use `improvements` instead.

## [붙여넣기 끝]

---

## 응답 병합 규칙

- 외부 LLM이 JSON으로 응답 → `blockers`는 플랜 해당 섹션에 반영, `improvements`는 선택 반영
- 원문은 플랜 파일 `## External Review (Raw)` 섹션에 append
- 외부 리뷰 실패/타임아웃 시에도 플랜 확정은 진행 (건너뜀 경고만 출력)
