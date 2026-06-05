# 배포 가이드 (Firebase Hosting · 무료 정적)

이 프로젝트는 **Next.js 정적 export(`output: "export"`)** 로 빌드해서
**Firebase Hosting(무료 Spark 요금제)** 에 배포합니다. 서버/SSR 없이 `out/` 정적 파일만 올립니다.

## 동작 방식 (무료)

```
코드 수정 → git push (main) → GitHub Actions 가 out/ 빌드 → Firebase Hosting 배포
```

또는 로컬에서 직접 배포(아래 "수동 배포") 도 가능합니다.

---

## 무료 모드의 동작/제약 (중요)

이 앱은 원래 서버 API(`/api/*`)가 있었지만, 무료 정적 배포에서는 서버가 없으므로
다음과 같이 동작합니다:

- ✅ **공개 사이트** (홈/소개/콘텐츠/도움말/쇼핑/문의 등) 정상 동작
- ✅ **문의 폼**: 서버 대신 **Firestore 에 직접 저장**(보안 규칙이 허용). 어드민 문의함에서 확인.
- ✅ **어드민 콘텐츠 관리**(페이지/블로그/배너/도움말 등): 클라이언트에서 Firestore 직접 CRUD — 정상.
- ✅ **콘텐츠 즉시 반영**: 공개 페이지가 브라우저에서 Firestore 를 직접 읽는 클라이언트 렌더링이라,
  어드민이 글/페이지를 추가·수정하면 **재배포 없이 즉시** 사이트에 반영됩니다.
  - 블로그/도움말 상세는 쿼리파라미터 URL(`/contents/view?slug=`, `/help/view?slug=`)
  - 새 커스텀 페이지(`/슬러그`)는 Firebase Hosting catch-all rewrite 로 런타임 렌더
  - 코어 페이지(home/about 등)는 시드/게시본을 먼저 렌더(SEO) 후 최신본으로 갱신
- ❌ **서버 필요 기능 비활성화**: 어드민의 AI 보조, 메일 발송, GitHub 이슈 생성,
  외부 키 통합관리(integrations), 백업 가져오기, Google Sheets 동기화.
  → 사용 시 "무료(정적) 배포 모드에서는 사용할 수 없습니다" 안내가 뜹니다.
  (원래 코드는 `src/_server-api-disabled/` 에 보존 — 추후 유료(App Hosting/Vercel) 전환 시 복구 가능)

---

## 최초 1회 설정 — GitHub Actions 자동 배포용 (선택)

push 할 때마다 자동 배포하려면 **서비스 계정 키 1개**를 GitHub Secret 으로 등록합니다:

1. Firebase 콘솔 > ⚙️ 프로젝트 설정 > **서비스 계정** > **새 비공개 키 생성** → JSON 다운로드
2. GitHub `withcomai-dev/web` > Settings > Secrets and variables > Actions > **New repository secret**
   - 이름: `FIREBASE_SERVICE_ACCOUNT`
   - 값: 다운로드한 JSON 파일 **전체 내용** 붙여넣기
3. 워크플로우 활성화: 저장소의 `.github/firebase-deploy.yml.example` 을
   `.github/workflows/firebase-deploy.yml` 로 옮깁니다 (GitHub 웹 UI 에서 파일 생성/이동).
4. 이후 main 에 push 하면 자동으로 빌드·배포됩니다.

> Firebase Hosting 자체는 무료(Spark)라 결제 설정이 필요 없습니다.
> (현재는 로컬 `firebase deploy` 로 배포 중 — CI 자동배포는 위 설정 시 활성화)

---

## 수동 배포 (로컬)

```bash
# 1) 한 번만: Firebase 로그인 (브라우저 인증)
firebase login

# 2) 빌드 + 배포
npm run build
firebase deploy --only hosting

# 보안 규칙(문의 폼이 동작하려면 필요)도 함께 배포
firebase deploy --only firestore:rules,storage
```

라이브 URL: https://withcomai-web.web.app

---

## 로컬 개발

```bash
npm install
npm run dev      # http://localhost:3000  (.env.local 의 Firebase 설정 사용)
```

`.env.local` 은 공개 Firebase 클라이언트 키를 담고 있으며 `.gitignore` 로 커밋되지 않습니다.
