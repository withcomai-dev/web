# SETUP.md — 플레이스홀더 채우기 가이드

> 템플릿 전체에서 `{{...}}` 로 표기된 빈칸을 프로젝트 값으로 치환한다.
> 아래는 전체 목록과 의미. 대부분 한 번만 정하면 된다.

---

## 1. 프로젝트 식별

| 플레이스홀더 | 의미 | 예시 |
|--------------|------|------|
| `{{PROJECT_NAME}}` | 프로젝트 표시 이름 | `My App` |
| `{{PROJECT_SLUG}}` | 영문 소문자 슬러그 (sentinel/락 파일 접두어) | `myapp` |
| `{{PROJECT_DESC}}` | 한 줄 제품 설명 | `B2B 인보이스 자동화 SaaS` |

## 2. 기술 스택 (ARCHITECTURE.md / agent.md 에서 사용)

| 플레이스홀더 | 의미 | 예시 |
|--------------|------|------|
| `{{FRAMEWORK}}` | 프레임워크 | `Next.js 16 (App Router)` |
| `{{LANGUAGE}}` | 언어 | `TypeScript (strict)` |
| `{{RUNTIME}}` | 런타임/배포 대상 | `Cloudflare Workers` · `Node.js` · `Vercel` |
| `{{DB}}` | 데이터베이스 + ORM | `PostgreSQL + Prisma` |
| `{{STYLING}}` | 스타일링 | `Tailwind CSS v4` |
| `{{AUTH}}` | 인증 | `Better Auth` · `NextAuth` |

## 3. 명령 (CLAUDE.md / 명령 파일에서 사용)

| 플레이스홀더 | 의미 | 기본값 |
|--------------|------|--------|
| `{{BUILD_CMD}}` | 빌드 (타입체크 포함) | `npm run build` |
| `{{TYPECHECK_CMD}}` | 타입 엄격 검증 | `npm run check` |
| `{{LINT_CMD}}` | 린트 | `npm run lint` |
| `{{PREVIEW_CMD}}` | 로컬 프리뷰/개발 서버 | `npm run preview` 또는 `npm run dev` |
| `{{PREVIEW_PORT}}` | 프리뷰 포트 | `3000` · `8788` |
| `{{DEPLOY_DEV_CMD}}` | dev 환경 배포 | `npm run deploy:dev` |
| `{{DEPLOY_PROD_CMD}}` | 프로덕션 배포 | `npm run deploy` |
| `{{E2E_CMD}}` | E2E 테스트 | `npm run test:e2e` |
| `{{DB_MIGRATE_CMD}}` | DB 마이그레이션 | `npm run db:migrate` |

## 4. 환경/URL

| 플레이스홀더 | 의미 | 예시 |
|--------------|------|------|
| `{{DEV_URL}}` | dev 배포 URL | `https://dev.myapp.com` |
| `{{PROD_URL}}` | 프로덕션 URL | `https://myapp.com` |
| `{{DEV_BRANCH}}` | 개발 브랜치명 | `dev` |
| `{{MAIN_BRANCH}}` | 프로덕션 브랜치명 | `main` |
| `{{TEST_ACCOUNT}}` | 테스트 계정 (이메일/비번) | `test@myapp.local / Pw1234!` |
| `{{LOCAL_TEST_ACCOUNT}}` | 로컬 E2E 전용 계정 | `e2e@myapp.local / Pw1234!` |

## 5. 디자인 시스템 (구현자 ★★★ 규칙에서 사용 — 선택)

| 플레이스홀더 | 의미 | 예시 |
|--------------|------|------|
| `{{TYPO_TOKENS}}` | 허용 타이포그래피 토큰 목록 | `text-display, text-h1~h4, text-body, text-meta, text-caption` |
| `{{TYPO_TOKEN_DEF}}` | 토큰 정의 위치 | `src/app/globals.css` |
| `{{NAV_FILE}}` | 네비게이션 정의 파일 | `src/components/Sidebar.tsx` |
| `{{I18N_FILES}}` | i18n 사전 파일 | `src/locales/ko.ts` + `en.ts` |
| `{{I18N_CHECK_CMD}}` | i18n 누수 검출 명령 | `npm run check:i18n` |

> i18n·타이포그래피 토큰을 안 쓰는 프로젝트면 구현자 ★★★ 규칙의 해당 항목을 삭제한다.

## 6. 알림 (선택)

| 플레이스홀더 | 의미 | 예시 |
|--------------|------|------|
| `{{NOTIFY_CMD}}` | 작업 완료 알림 명령 | `node scripts/notify.mjs` (Discord/Slack) |

> 알림이 필요 없으면 명령 파일의 "완료 알림" 단계를 통째로 삭제한다.

## 7. 런타임 제약 (RELIABILITY.template.md 에서 사용 — 선택)

플랫폼 고유의 배포 함정이 있으면 채운다. 없으면 RELIABILITY.md 를 간소화한다.

| 플레이스홀더 | 의미 | 예시 |
|--------------|------|------|
| `{{RUNTIME_CONSTRAINTS}}` | 런타임 금지/제약 사항 | `Node.js fs/path 사용 불가, process.env 대신 env 바인딩` |
| `{{DEPLOY_FAILURE_CODE}}` | 대표적 배포 실패 증상 | `cold-start 1101` · `502` |
| `{{ROLLBACK_CMD}}` | 롤백 명령 | `git revert HEAD && npm run deploy` |
| `{{LOG_CMD}}` | 배포/런타임 로그 수집 명령 | `npx wrangler tail` · `vercel logs` |

## 8. 보안 (SECURITY.template.md / agent.md — 선택)

| 플레이스홀더 | 의미 | 예시 |
|--------------|------|------|
| `{{ENCRYPTION_SERVICE_PATH}}` | 시크릿 암호화 서비스 위치 | `src/lib/crypto/EncryptionService.ts` |
| `{{ENV_ACCESS_METHOD}}` | 런타임 환경변수 접근 방법 | `getCloudflareContext().env` · `process.env` |

> 사용자 시크릿/암호화가 없는 프로젝트면 SECURITY.md 의 암호화 섹션을 삭제한다.

## 런타임 변수 (채우지 않음)

아래는 **이식 시 채우는 값이 아니라**, 명령 실행 중 자동 치환되는 런타임 변수다. 그대로 둔다.

| 변수 | 치환 시점 |
|------|----------|
| `{{PLAN_CONTENT}}` | `external-review-prompt.md` 사용 시 플랜 본문으로 자동 치환 |

---

## 치환 자동화 (선택)

수동 치환이 번거로우면 sed 일괄 치환:

```bash
# 예시 — 실제 값으로 바꿔서 실행
grep -rl '{{PROJECT_SLUG}}' . | xargs sed -i '' 's/{{PROJECT_SLUG}}/myapp/g'   # macOS
# Linux 는 sed -i (따옴표 없이)
```

또는 **에이전트에게 위임**: "SETUP.md 표를 기준으로 harness 전체의 플레이스홀더를
이 프로젝트 값으로 채워줘. 모르는 값은 나에게 물어봐." 가 가장 빠르다.

---

## 채운 뒤 검증

```bash
# 남은 플레이스홀더가 없는지 확인 (0건이어야 함)
grep -rn '{{' AGENTS.md CLAUDE.md ARCHITECTURE.md docs/ .claude/ scripts/ | grep -v SETUP.md
```
