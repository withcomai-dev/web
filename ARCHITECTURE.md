# ARCHITECTURE.md — 시스템 아키텍처 개요

> 빠른 아키텍처 파악용 문서. 프로젝트별로 채운다. 상세는 분리 파일로 lazy load.

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | Next.js 16 (App Router) | |
| 언어 | TypeScript (strict) | 느슨한 타입 금지 |
| 스타일링 | Tailwind CSS v4 | |
| 런타임 | Firebase App Hosting (SSR · Cloud Run · asia-east1), web.app은 Firebase Hosting 프록시 | 빌드 샌드박스에서 Firestore egress 차단(빌드시 Firestore 못 읽음 — 콘텐츠는 클라이언트 렌더) · gcloud 미설치(IAM/API활성화/로그는 firebase refresh_token 으로 REST 직접) · App Hosting 자동 롤아웃 불안정 → push 후 수동 롤아웃 필수 · Firebase Hosting CDN 이 페이지를 1년 캐시 → firebase.json no-store 헤더로 차단 · 커스텀토큰 서명에 컴퓨트 SA serviceAccountTokenCreator IAM 필요 |
| DB | Firestore (firebase-admin) | |
| 인증 | 런모아(RunMoa) OAuth → Firebase 커스텀 토큰 (RBAC: superadmin/admin/user) | |
| 패키지 | npm | |

---

## 핵심 데이터 흐름

```
[공개]    브라우저 → Firebase Hosting(web.app, no-store) → rewrite(**) → App Hosting(Next.js SSR · withcomweb Cloud Run)
[콘텐츠]  어드민이 Firestore 직접 수정(클라 SDK) → 공개 페이지가 브라우저에서 Firestore 직접 read(빌드시 Firestore 차단 우회 → 재배포 없이 즉시 반영)
[로그인]  헤더 로그인 → 런모아 호스티드 로그인 → /auth/callback(서버: client_secret 토큰교환 + 커스텀토큰 발급) → /auth/done(signInWithCustomToken) → Firebase 세션
[어드민]  AdminGuard(Firebase 세션 + role) · 서버 API requireAdmin(idToken 검증) · firestore.rules isAdmin — 3중 강제
[로그아웃] fullLogout(로컬 전부 정리) → 런모아 runmoa-logout(SSO 종료) → 메인 복귀
```

---

## 디렉토리 구조 (핵심만)

```
src/
├── app/
│   ├── (public)/      공개 사이트(홈·소개·콘텐츠·문의·쇼핑 등) — 대부분 클라이언트 렌더
│   ├── admin/         어드민 CMS (AdminGuard 보호) — page.tsx 대시보드 + 관리 페이지들
│   ├── api/           서버 라우트 (inquiries·ai·mail·github·backup·admin — 대부분 requireAdmin)
│   └── auth/          런모아 콜백(callback/route.ts) + done(세션 수립)
├── lib/               firebase(client)·firebase-admin·firestore·runmoa-*(oauth/roles/members/session)·logout·authed-fetch·api-auth
├── components/        admin/* · layout/(Nav·Footer) · sections/* · feedback · help
├── contexts/          AuthContext (Firebase 세션 + role)
└── types/cms.ts       Firestore 문서 타입
```

---

## 핵심 아키텍처 패턴

1. **web.app → App Hosting 프록시** — `firebase.json` rewrite(`**`→withcomweb run) + no-store 헤더. 배포는 main push + **수동 롤아웃**.
2. **콘텐츠 클라이언트 렌더** — 빌드 샌드박스 Firestore 차단 우회. 공개 페이지가 브라우저에서 직접 Firestore read → 어드민 수정 즉시 반영(재배포 불필요).
3. **런모아 OAuth → Firebase 커스텀 토큰** — 외부 IdP를 Firebase 세션으로 연결해 기존 인증 인프라(rules·api-auth·AdminGuard) 재사용. (상세: 메모리 `auth-architecture`)
4. **서버 전용 시크릿** — `client_secret` 등은 `server-only` 모듈 + apphosting.yaml Secret Manager. 클라 번들 노출 금지.
5. **gcloud 없이 IAM/배포/로그** — firebase refresh_token 으로 GCP REST 직접 호출. (상세: 메모리 `deploy-setup`)

---

## 관련 문서

- `docs/SECURITY.md` — 보안 규칙
- `docs/RELIABILITY.md` — 배포 안정성, 롤백
- `docs/QUALITY_SCORE.md` — 품질 평가
