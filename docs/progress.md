# progress.md — 개발 진행 상황

> Append-only. 최신 블록이 위에 오도록 추가.

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
