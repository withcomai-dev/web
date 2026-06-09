@AGENTS.md
@ARCHITECTURE.md

> **에이전트 헌법**: [AGENTS.md](./AGENTS.md) — 역할 정의, 문서 우선순위, 행동 원칙 (세션 시작 시 자동 로드)
> **시스템 아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md) — 기술 스택, 디렉토리 구조, 핵심 패턴 (세션 시작 시 자동 로드)

# CLAUDE.md

## Project Overview

위드컴정보 — 중소기업의 스마트워크·생성형 AI 도입을 지원하는 회사 사이트/CMS (Next.js 16 + Firestore). 어드민 CMS로 콘텐츠·문의·런모아 회원·권한 관리.

- **Stack**: Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 · Firestore (firebase-admin) · 런모아(RunMoa) OAuth → Firebase 커스텀 토큰 (RBAC: superadmin/admin/user) · Firebase App Hosting (SSR · Cloud Run · asia-east1), web.app은 Firebase Hosting 프록시
- **Production (main)**: https://withcomai-web.web.app
- **Dev (main)**: https://withcomai-web.web.app
- **테스트 계정 (dev/prod 공통)**: `.env.local` 의 TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD 참조
- **로컬 E2E 테스트 계정**: `.env.local` 의 TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD 참조

## 브랜치 전략 (이 프로젝트: `main` 단일)

이 프로젝트는 **`main` 단일 브랜치 + 단일 환경(web.app)** 이다. (별도 dev 환경 없음, git 훅 미설치)
→ 하네스 원본의 dev/main 분리는 이 프로젝트엔 적용하지 않는다.

- 모든 개발·커밋·푸시·배포·테스트는 `main` 기준.
- **배포 = `main` push → App Hosting 자동 롤아웃**. ⚠️ 단 **자동 롤아웃이 자주 누락**되므로 push 후 **수동 롤아웃 필수**: `firebase apphosting:rollouts:create withcomweb --git-branch main --force` → SUCCEEDED 확인.
- web.app 프록시(Firebase Hosting) 설정 변경 시에만 `firebase deploy --only hosting`.
- ⚠️ **라이브 사이트**이므로 위험·비가역 변경은 사용자 확인 후. (상세: `docs/RELIABILITY.md`)

## Commands

```bash
npm run dev                 # 로컬 개발 서버 (port 3000)
npm run build               # 프로덕션 빌드 (타입체크 포함)
npm run typecheck           # tsc --noEmit 타입 엄격 검증
npm run lint                # 린트
npm run deploy:rules        # Firestore/Storage 보안규칙 배포
# 배포:  git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force
# DB:    Firestore — 스키마 마이그레이션 없음
# E2E:   전역 playwright(~/.nvm/.../bin/playwright, NODE_PATH=전역 modules) 스크립트 수동 실행 (아래 테스트 규칙)
```

## Trigger Keywords

| 키워드 | 동작 |
| ------ | ---- |
| `빌드` / `build` | `npm run build` |
| `배포` / `deploy` | `git push origin main` → **수동 롤아웃**(`firebase apphosting:rollouts:create withcomweb --git-branch main --force`) → SUCCEEDED 확인 → web.app curl 200 |
| `테스트` / `test` | Playwright 로 **web.app** 전체 테스트 → 버그 수정 → 빌드 → 커밋 → 배포(수동 롤아웃) → 재테스트 (버그 0건까지) |
| `커밋` / `commit` | git commit (push 안 함) |
| `푸시` / `push` | `git push origin main` |
| `테커푸` / `tcp` | 빌드 → 로컬 검증 → 커밋 → 푸시 → **수동 롤아웃** → web.app 테스트 |
| `구현해` / `implement` | `/implement` — 실행 계획 기반 구현 |
| `테스트만` / `test only` | `/test` — 빌드 + 로컬 테스트 (커밋·배포 없음) |
| `자동` / `auto` | `/auto` — 팀장 에이전트 (완전 자율 루프, 배포까지 자동) |
| `플랜` / `plan` | `/plan` — 실행 계획 작성 |
| `리뷰` / `review` | `/review` — 품질 검토 |
| `반영` / `reflect` | `/reflect` — 교훈 추출 및 하네스 개선 |

> 단일 브랜치라 하네스 원본의 `메인적용`·`메인목록`(dev→main 머지) 키워드와 `/main-apply` 명령은 사용하지 않는다.

### 공통 규칙

- **배포 후 검증** — 롤아웃 SUCCEEDED 확인 + web.app 에서 실제 동작 확인. **자동 롤아웃은 믿지 말 것**(항상 수동 롤아웃).
- **버그 수정 사이클**: 버그 일괄 수정 → 빌드 → 커밋 → push → 수동 롤아웃 → **즉시** 테스트(연관 기능 회귀 포함). 클린 패스까지 반복.
- **CDN 캐시 주의** — web.app(Firebase Hosting)은 페이지를 캐시할 수 있음. 배포 반영 확인은 force-dynamic 라우트 말고 **실제 페이지/동작·캐시 헤더(`curl -I` no-store/MISS)**로 한다. (상세: `docs/RELIABILITY.md`)
- **git 훅 미설치** — 브랜치보호·자동배포 훅은 이 프로젝트에서 쓰지 않음(main push=배포 구조라 충돌).

## Coding Rules

> 상세 규칙·예시·예외는 [`docs/agent.md`](./docs/agent.md)(있으면). 아래는 가장 자주 걸리는 5개 요약.

- **주석 한글** (또는 프로젝트 언어), `any` 등 느슨한 타입 금지, 비즈니스 로직은 서비스 클래스/모듈로 캡슐화 (라우트 핸들러에 직접 로직 금지)
- **Page 패턴** (해당 시): `page.tsx` = Server Component → `_components/*.tsx` = Client Components
- **네이밍**: Components `PascalCase`, classes `PascalCase`, utilities `camelCase`
- **i18n**: 이 프로젝트는 미사용 (한국어 단일). 사용자 노출 문구는 자연스러운 한국어로 직접 작성(기계번역체·모호한 라벨 금지)
- **연쇄 반영**: 기능 수정 시 연관 지점 모두 추적 (API↔UI, DB↔서비스, i18n, 타입/Props 전파, 설정↔기능, 테스트·진행 문서 동기화)

## 테스트 규칙

**브라우저 자동화 MCP 필수** (Playwright 등) — 실 브라우저에서 대상 URL 직접 조작.

### `테스트` (Dev)

브라우저 MCP로 **Dev URL** 전체 테스트 → 버그 수정 사이클 → 클린 패스까지 반복.
- 테스트 URL: https://withcomai-web.web.app
- 테스트 계정: `.env.local` 의 TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD 참조

### `프리뷰 테스트` (로컬 → Dev)

Phase 1: `npm run dev` (localhost:3000) → 브라우저 MCP 전체 테스트 → 로컬 클린 패스까지 반복
Phase 2: 커밋 → `git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force` → 푸시 → **Dev** 전체 테스트

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
