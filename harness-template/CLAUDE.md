@AGENTS.md
@ARCHITECTURE.md

> **에이전트 헌법**: [AGENTS.md](./AGENTS.md) — 역할 정의, 문서 우선순위, 행동 원칙 (세션 시작 시 자동 로드)
> **시스템 아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md) — 기술 스택, 디렉토리 구조, 핵심 패턴 (세션 시작 시 자동 로드)

# CLAUDE.md

## Project Overview

{{PROJECT_DESC}}

- **Stack**: {{FRAMEWORK}} · {{LANGUAGE}} · {{STYLING}} · {{DB}} · {{AUTH}} · {{RUNTIME}}
- **Production ({{MAIN_BRANCH}})**: {{PROD_URL}}
- **Dev ({{DEV_BRANCH}})**: {{DEV_URL}}
- **테스트 계정 (dev/prod 공통)**: {{TEST_ACCOUNT}}
- **로컬 E2E 테스트 계정**: {{LOCAL_TEST_ACCOUNT}}

## 브랜치 전략 (필수 준수)

| 브랜치 | 용도 | 배포 대상 |
|--------|------|-----------|
| `{{DEV_BRANCH}}` | **모든 개발** — 커밋/푸시/배포 기본 브랜치 | {{DEV_URL}} |
| `{{MAIN_BRANCH}}` | 프로덕션 — **사용자 머지 요청 시에만** 변경 | {{PROD_URL}} |

- **개발은 무조건 `{{DEV_BRANCH}}` 브랜치**에서 진행
- 커밋 → 푸시 → 배포 → 테스트 모두 `{{DEV_BRANCH}}` 기준
- `{{MAIN_BRANCH}}` 머지는 사용자가 명시적으로 요청할 때만 수행

## Commands

```bash
{{PREVIEW_CMD}}              # 로컬 개발 서버 / 프리뷰 (port {{PREVIEW_PORT}})
{{BUILD_CMD}}               # 프로덕션 빌드 (타입체크 포함)
{{TYPECHECK_CMD}}           # 빌드 + 타입 엄격 검증
{{LINT_CMD}}                # 린트
{{E2E_CMD}}                 # E2E 테스트
{{DEPLOY_DEV_CMD}}          # [dev] dev 환경 배포
{{DEPLOY_PROD_CMD}}         # [main] 프로덕션 배포
{{DB_MIGRATE_CMD}}          # DB 마이그레이션 적용
```

## Trigger Keywords

| 키워드 | 동작 |
| ------ | ---- |
| `빌드` / `build` | `{{BUILD_CMD}}` |
| `배포` / `deploy` | **[dev 브랜치]** `{{DEPLOY_DEV_CMD}}` 후 dev URL curl 200 확인 |
| `테스트` / `test` | **[dev]** Dev URL 테스트 → 버그 수정 → 커밋 → 배포 → 푸시 → 재테스트 (버그 0건까지) |
| `프리뷰 테스트` / `preview test` | 로컬 프리뷰 테스트 → 클린 패스 후 커밋 → dev 배포 → 푸시 → 테스트 진행 |
| `커밋` / `commit` | git commit (푸시 안 함, **dev 브랜치** 확인) |
| `푸시` / `push` | `git push origin HEAD` (**dev 브랜치** 기준) |
| `테커푸` / `tcp` | 빌드 → 로컬 프리뷰 검증 → 커밋 → 푸시 → **dev 배포** → dev 테스트 진행 |
| `메인적용` | dev 전체 → main 머지 + 프로덕션 배포 → 안정화 대기 → 프로덕션 테스트. **이 키워드가 없으면 절대 main 머지 금지.** 실행 전 `/tmp/{{PROJECT_SLUG}}-allow-merge` 센티널 생성 |
| `메인적용 {영역}` | dev에서 `{영역}` 커밋만 cherry-pick → main + 프로덕션 배포 → 테스트 |
| `메인목록` | dev에만 있고 main에 없는 커밋을 영역별로 그룹핑해서 표시 (`git log --oneline {{DEV_BRANCH}} --not {{MAIN_BRANCH}}`) |
| `구현해` / `implement` | `/implement` — 실행 계획 기반 구현 |
| `테스트만` / `test only` | `/test` — 빌드 + 로컬 프리뷰 테스트 (커밋·배포 없음) |
| `자동` / `auto` | `/auto` — 팀장 에이전트 (완전 자율 개발 루프, dev 배포까지 자동) |
| `플랜` / `plan` | `/plan` — 실행 계획 작성 |
| `리뷰` / `review` | `/review` — 품질 검토 |
| `반영` / `reflect` | `/reflect` — 교훈 추출 및 하네스 개선 |

### 공통 규칙

- **Dev 배포 후 대기 없음** — `{{DEPLOY_DEV_CMD}}` 완료 즉시 테스트 진행
- **Main 머지 후 안정화 대기** — 프로덕션 cold start/캐시 안정화. 머지 → 배포 → 대기 → 테스트 (대기 시간은 RELIABILITY.md 참조; 즉시 검증 가능한 플랫폼이면 0)
- **배포 실패 재배포** — 재배포 완료 즉시 테스트 진행 (대기 없음)
- **버그 수정 사이클 (Dev)**: 버그 일괄 수정 → 빌드 → 커밋 → 배포 → **즉시** 테스트(연관 기능 회귀 포함). 클린 패스까지 반복
- **post-commit 자동 배포 가드** — `{{MAIN_BRANCH}}` 브랜치 커밋만 프로덕션 자동 배포. `{{DEV_BRANCH}}`/기타 브랜치는 훅이 자동 skip. 훅은 `scripts/hooks/`에 커밋되어 `core.hooksPath`로 연결. 신규 머신은 `bash scripts/install-hooks.sh` 1회 실행
- **main push/머지 가드** — `pre-push`·`pre-merge-commit` 훅이 `/tmp/{{PROJECT_SLUG}}-allow-merge` sentinel(TTL 300초) 없으면 차단. sentinel 생성·정리는 `/main-apply` 명령이 책임

## Coding Rules

> 상세 규칙·예시·예외는 [`docs/agent.md`](./docs/agent.md)(있으면). 아래는 가장 자주 걸리는 5개 요약.

- **주석 한글** (또는 프로젝트 언어), `any` 등 느슨한 타입 금지, 비즈니스 로직은 서비스 클래스/모듈로 캡슐화 (라우트 핸들러에 직접 로직 금지)
- **Page 패턴** (해당 시): `page.tsx` = Server Component → `_components/*.tsx` = Client Components
- **네이밍**: Components `PascalCase`, classes `PascalCase`, utilities `camelCase`
- **i18n** (해당 시): 모든 사용자 노출 문자열 `t('section.key')` → {{I18N_FILES}} 양쪽 반영
- **연쇄 반영**: 기능 수정 시 연관 지점 모두 추적 (API↔UI, DB↔서비스, i18n, 타입/Props 전파, 설정↔기능, 테스트·진행 문서 동기화)

## 테스트 규칙

**브라우저 자동화 MCP 필수** (Playwright 등) — 실 브라우저에서 대상 URL 직접 조작.

### `테스트` (Dev)

브라우저 MCP로 **Dev URL** 전체 테스트 → 버그 수정 사이클 → 클린 패스까지 반복.
- 테스트 URL: {{DEV_URL}}
- 테스트 계정: {{TEST_ACCOUNT}}

### `프리뷰 테스트` (로컬 → Dev)

Phase 1: `{{PREVIEW_CMD}}` (localhost:{{PREVIEW_PORT}}) → 브라우저 MCP 전체 테스트 → 로컬 클린 패스까지 반복
Phase 2: 커밋 → `{{DEPLOY_DEV_CMD}}` → 푸시 → **Dev** 전체 테스트

### 핵심

- "보고 끝"이 아니라 **모든 버튼/입력/CRUD/모달을 직접 실행**하고 결과 확인
- 외부 연동: 사용자에게 가능 여부 질문, "패스" 시 건너뜀
- 테스트 진입 전 `docs/test-plans/{기능명}.md` 작성/업데이트 후 실행

## Key Docs

- `docs/agent.md` — 코딩 규칙, 원칙, 구성 기준 (프로젝트별 작성)
- `docs/progress.md` — 개발 진행 상황
- `docs/QUALITY_SCORE.md` — 품질 평가 체크리스트
- `docs/SECURITY.md` — 보안 규칙
- `docs/RELIABILITY.md` — 배포 안정성, 롤백
- `docs/references/active-lessons.md` — 최근 30일 활성 경고 (모든 에이전트 필수)
