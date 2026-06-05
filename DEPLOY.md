# 배포 가이드 (Firebase App Hosting)

이 프로젝트는 **Firebase App Hosting** 으로 배포합니다. App Hosting 은 Next.js 를
SSR(서버 사이드 렌더링) + API 라우트까지 완전히 구동하므로, 문의 폼·AI·메일 발송 등
`/api/*` 서버 기능이 실제로 동작합니다.

> ⚠️ 기존 정적(`firebase deploy --only hosting`) 배포는 더 이상 사용하지 않습니다.
> 정적 배포에서는 `/api/*` 가 전부 404 가 되어 서버 기능이 깨집니다.

---

## 동작 방식 (한 번 연결하면 끝)

```
코드 수정 → git push (main) → App Hosting 이 자동 빌드 → Cloud Run 에 배포
```

`apphosting.yaml` 이 빌드/실행 설정과 환경변수를 정의합니다.

---

## 최초 1회 설정 (사용자가 Firebase 콘솔에서 진행)

1. **App Hosting 백엔드 생성**
   - https://console.firebase.google.com/project/withcomai-web/apphosting 접속
   - **시작하기 / 백엔드 만들기** 클릭

2. **GitHub 저장소 연결**
   - GitHub 계정 인증 후 `withcomai-dev/web` 저장소 선택
   - **라이브 브랜치: `main`** 선택 (push 시 자동 배포)
   - 루트 디렉터리: `/` (기본값)

3. **배포 완료 후 도메인 확인**
   - App Hosting 백엔드 URL (예: `https://<backend>--withcomai-web.<region>.hosted.app`) 발급됨
   - 기존 `withcomai-web.web.app` 주소로 서비스하려면 App Hosting 의
     **커스텀 도메인/사이트 연결** 설정에서 연결

4. **(선택) 서버 비밀값 등록** — 문의 메일 발송·AI·GitHub 이슈 기능을 켜려면 필요
   ```bash
   firebase apphosting:secrets:set GEMINI_API_KEY
   firebase apphosting:secrets:set SMTP_USER
   firebase apphosting:secrets:set SMTP_APP_PASSWORD
   # ... (apphosting.yaml 주석 참고)
   ```
   등록 후 `apphosting.yaml` 의 해당 `secret:` 항목 주석을 해제하고 push 하면 적용됩니다.

---

## 이후 배포 (Claude / 개발자)

코드 수정 후:

```bash
git add -A
git commit -m "..."
git push        # → App Hosting 이 자동 빌드·배포
```

별도 배포 명령 불필요. 배포 상태는 콘솔 App Hosting 탭에서 확인.

---

## Firestore / Storage 보안 규칙 배포

규칙(`firestore.rules`, `storage.rules`)은 App Hosting 과 별개로 배포합니다:

```bash
npm run deploy:rules   # firebase deploy --only firestore:rules,storage
```

---

## 로컬 개발

```bash
npm install
npm run dev      # http://localhost:3000  (.env.local 의 Firebase 설정 사용)
```

`.env.local` 은 공개 Firebase 클라이언트 키를 담고 있으며 `.gitignore` 로 커밋되지 않습니다.
서버 기능(메일/AI 등)을 로컬에서 테스트하려면 `.env.local` 에 해당 서버 키를 추가하세요.
