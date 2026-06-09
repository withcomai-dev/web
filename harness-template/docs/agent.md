# Agent 가이드 (agent.md)

> 코딩 규칙·OOP·런타임 사용 패턴의 **단일 원천**. 코드 작성 전 반드시 확인.
> `CLAUDE.md §Coding Rules`는 이 문서의 요약판이며, 상세/예외는 여기서 확인한다.
> 배포·롤백은 `docs/RELIABILITY.md`가 원천.

---

## 1. 개발 원칙

### 1-1. 객체지향(OOP) 기반 설계
- 비즈니스 로직은 **클래스/서비스 모듈**로 캡슐화
- 단일 책임 원칙(SRP): 하나의 클래스는 하나의 역할만
- 라우트 핸들러는 서비스를 **인스턴스화하여 사용**하며 로직을 직접 작성하지 않음

```
// ✅ 올바른 패턴 — 라우트는 서비스 호출만
export async function POST(request) {
  const writer = new FeatureService(deps)
  return Response.json(await writer.run(input))
}

// ❌ 잘못된 패턴 — 라우트에 로직 직접 작성
export async function POST(request) {
  const res = await fetch('https://external/...')  // 복잡한 로직 직접
}
```

### 1-2. 주석 작성 기준
- **모든 주석은 한글** (또는 프로젝트 언어)로 작성
- 클래스/메서드/함수에 문서화 주석(JSDoc 등) 필수
- 외부 API 호출에는 API 명세 참조 주석 추가

### 1-3. 타입 안전성
- 느슨한 타입(`any` 등) 금지 (린트로 강제)
- API 응답 타입은 `types/` 디렉토리에 정의
- 외부 입력(특히 요청 body)은 스키마(Zod 등)로 런타임 검증

### 1-4. 에러 처리
- 모든 외부 API 호출에 try-catch 필수
- 에러는 실행 로그에 기록
- 사용자에게는 친화적 메시지 반환 (내부 에러 노출 금지)

---

## 2. 페이지 분리 기준 (Server vs Client — 해당 프레임워크 시)

| 파일 | 타입 | 규칙 |
|------|------|------|
| `app/**/page.tsx` | Server | async 함수, DB 조회, 메타데이터 |
| `app/**/layout.tsx` | Server | 공통 레이아웃, 인증 체크 |
| `app/**/_components/*.tsx` | Client | `'use client'` 디렉티브 필수 (useState/이벤트/브라우저 API) |
| `app/**/loading.tsx` | Server | Suspense fallback |
| `app/**/error.tsx` | Client | 에러 바운더리 |

---

## 3. 런타임 호환 규칙

> {{RUNTIME}} 환경의 제약. 상세는 RELIABILITY.md.

- {{RUNTIME_CONSTRAINTS}}
- 환경변수 접근: {{ENV_ACCESS_METHOD}} (`process.env` 직접 사용 금지인 경우)
- DB/스토리지 접근: 런타임 바인딩/클라이언트 통해서만

---

## 4. 파일 명명 규칙

- 컴포넌트: `PascalCase.tsx`
- 서비스/클래스: `PascalCase.ts`
- 유틸/타입: `camelCase.ts`
- 라우트: `route.ts` (고정, 해당 프레임워크 시)

---

## 5. import 순서

```
// 1. 프레임워크 (React/Next 등)
// 2. 외부 라이브러리
// 3. 내부 모듈 (절대경로 @/)
```

---

## 6. 금지 사항

| 금지 항목 | 이유 |
|----------|------|
| 시크릿/API Key 평문 저장 | 보안 위험 (암호화 필수) |
| 복호화된 시크릿을 로그에 출력 | 보안 위험 |
| 느슨한 타입 사용 | 타입 안전성 훼손 |
| 라우트 핸들러에 직접 로직 작성 | OOP 원칙 위반 |
| 외부 서비스 ToS 위반 (스크래핑·스팸) | 계정 정지 위험 |
