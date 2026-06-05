# 비활성화된 서버 API 라우트 (보존용)

이 폴더의 라우트들은 원래 `src/app/api/` 에 있던 Next.js 서버 라우트입니다.

무료 **정적 export(`output: "export"`)** 배포에서는 서버가 없어 `/api/*` 가 동작하지 않으므로,
빌드에서 제외하기 위해 `src/app/` 밖으로 옮겨 **보존**해 두었습니다.

## 포함 기능
문의 접수(메일/시트 동기화), AI(Gemini) 보조, 메일 발송, GitHub 이슈 생성,
외부 키 통합관리, 백업 export/import, 예약 발행 cron.

## 다시 켜려면 (유료/서버 호스팅 전환 시)
1. 이 폴더를 다시 `src/app/api/` 로 이동
2. `next.config.ts` 의 `output: "export"` 제거
3. Firebase App Hosting 또는 Vercel 등 SSR 가능한 호스팅으로 배포
4. 클라이언트의 `featureDisabled()` 호출부(어드민)와 `InquiryForm` 의 Firestore 직접 쓰기를
   원래의 `fetch("/api/...")` 방식으로 되돌리기

현재 클라이언트는 `src/lib/static-mode.ts` 의 `featureDisabled()` 로 이 기능들을 막고 있습니다.
