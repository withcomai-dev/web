# progress.md — 개발 진행 상황

> Append-only. 최신 블록이 위에 오도록 추가.

## [2026-06-12 12:50] 지원사업 구조 개편 완료 — AI TOOL 소개식

### 현재 진행
- 홈·/sme-support: 리스트 직노출 → 진입 카드 2개(소상공인·R&D) / 카테고리 페이지에서 썸네일 카드 → applyUrl 새 탭 직행(없으면 상세 폴백)
- 커밋 de560da, 자동 롤아웃 rollout-2026-06-12-001 SUCCEEDED, web.app E2E 6/6
- 교훈: App Hosting rollouts 목록 API 기본 정렬은 최신순 아님(pageSize=1 오판 → 수동 롤아웃 2회 중복 — 무해) → active-lessons 정정

### 미해결 이슈
- 지원사업 항목별 썸네일·사이트 URL 입력은 운영 작업 (어드민 → 중소기업 지원)


## [2026-06-11 21:00] 구글시트 문의 연동 완료

### 현재 진행
- 서비스계정 sheets-inquiries@withcomai-web.iam.gserviceaccount.com 생성 + Sheets API 활성화 (전부 REST, 콘솔 작업 0)
- 갑 제공 시트("상담 및 문의 리스트", ID 1ExX3...FdLY)에 "문의" 탭 + 헤더(접수일시~문의내용) 생성
- integrations 문서에 3키 등록 (서버 전용 — 클라 차단 룰 유지)
- E2E: web.app 문의 제출 → 시트 행 자동 기록 확인 → 테스트 행·테스트 문의 정리 완료

### 미해결 이슈
- 시트가 "링크 편집" 공유 상태 — 보안 권고: 링크 공유 해제 후 서비스계정 이메일만 편집자 공유 (전달함)
- SMTP(문의 답변 메일) 키는 여전히 미설정 — 필요 시 별도 셋업


## [2026-06-11 17:30] 라운드2 (수정·보완) 완료 — web.app 검증 클린 패스

### 현재 진행
- 라운드2 6건 모두 라이브 검증 완료 (커밋 25bd0ff·e05543a, rollout-003·004 SUCCEEDED)
  - 🐛 신규 초안 저장 실패 근본 원인 수정: 클라 SDK가 undefined 필드 거부(addDoc throw) + 어드민 목록 orderBy가 초안 제외 → undefined 키 제거 + 전체조회·클라정렬 (ai-tools·contents)
  - AI TOOL 에디터: 슬러그·발행일 입력란 제거(자동화), 기존 글 데이터 정정(RHWP)
  - Firebase Storage: REST로 기본 버킷 생성(v1alpha defaultBucket, body {location}) + rules 배포 + 서비스 에이전트 datastore.viewer 부여(cross-service) + 문의 첨부 전용 경로/read 규칙 → 썸네일·문의 첨부 업로드 검증 통과
  - 홈 원페이지 재구성(노션 6번 정밀 재해석): 히어로→핵심역량→스마트워크 배너→AI TOOL 소개→콘텐츠→IT 배너(이미지)→WHY INFRA→하드웨어→소프트웨어→SME 배너→리스트→서비스 2×2→문의
- mall.withcom.co.kr SSL 발급 완료 (uhost CNAME 처리 결함 → A 레코드 전환으로 해결, CN=mall.withcom.co.kr ~9/9 자동갱신)

### 다음 단계
- 구글시트 연동 키 설정 (withcomai@gmail.com 시트 + 서비스계정 — 사용자 협조 대기)
- AI TOOL 게시판 원고 입력 (어드민에서 — 슬러그·발행일 자동)
- /reflect 교훈 정리 및 exec-plan completed 이동

### 핵심 결정사항
- 문의 첨부 read: isAdmin → isSignedIn (업로더가 다운로드 URL 수신 필요, 경로는 UUID로 추측 불가)
- bgImage형 배너는 이미지로 렌더(텍스트 없음) — 홈 IT 배너는 it-service와 동일 이미지 사용

### 미해결 이슈
- feedback 스크린샷 업로드도 동일 패턴(비로그인 업로드 후 read isAdmin) — 잠재 깨짐, 후속 확인 필요
- 기존 contents 게시글 중 어드민 목록에서 안 보이던 초안이 있었다면 이제 표시됨 — 갑에게 안내

## [2026-06-11 12:20] /implement 압축 #1 — 2차 요청사항 구현 완료

### 현재 진행
- 노션 "2차 요청사항 정리 2026.06.11" 6건 분석 → 실행 계획(`docs/exec-plans/active/second-revision-request.md`) 승인 → 구현 완료
- 빌드 성공 (BUILD_EXIT:0) · 위드컴정보 문자열 src/scripts 0건
- 신규: /ai-tools(+view) 게시판 · /admin/ai-tools CRUD · /api/inquiries/public(마스킹) · SearchOverlay(⌘K) · InquiryList · scripts/migrate-revision2.ts
- 수정: 회사명→WITHCOM AI 전체 치환 · 푸터 주소/전화 삭제 · ContactSection 이메일만 · 홈 services 2×2(4카드) · 콘텐츠 pinned 고정 노출(홈 6개) · CardsSection href 지원 · firestore.rules aiTools 추가

### 다음 단계
- 커밋 → push → 수동 롤아웃(`firebase apphosting:rollouts:create withcomweb --git-branch main --force`)
- `npm run deploy:rules` (aiTools 규칙)
- `npm run migrate:rev2` 실행 (대상: page_contact email/showList — page_home·smartwork-ai는 Firestore 미존재, 시드 폴백이라 배포만으로 반영)
- web.app E2E 검증 (Playwright) + 테스트 플랜 작성
- 구글시트: withcomai@gmail.com 시트 생성·서비스계정 공유 후 어드민 외부 서비스 키 설정 (사용자 협조)

### 핵심 결정사항
- 푸터 법적 고지(대표·사업자번호) 유지, 주소·전화만 삭제
- 문의 공개 리스트: 유형·마스킹 이름(홍*동)·날짜·답변상태만 (내용 비공개, 서버 API 경유, rules 변경 없음)
- 검색: 클라이언트 통합검색(콘텐츠·공지·지원사업·AI TOOL, published만)
- 마이그레이션 인증: .env.local 서비스계정 없음 → firebase CLI refresh token→임시 ADC 폴백 (dry-run 검증 완료, 변경 1건=page_contact)

### 미해결 이슈
- 구글시트 연동 키 미설정 (integrations: googleSheetsServiceAccountEmail/PrivateKey/InquiryId) — 사용자 협조 필요
- AI TOOL 게시판 초기 글 0건 (빈 상태 안내는 구현됨) — 원고 입력 필요
