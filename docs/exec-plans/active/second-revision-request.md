# 실행 계획: 2차 요청사항 반영 (2026-06-11)

> 원본 요청: 노션 "2차 요청사항 정리 2026.06.11"
> (https://gleaming-dracorex-303.notion.site/2-2026-06-11-37b76f3476408050a2d0f699e5708766)

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-06-11 |
| 상태 | 완료 (배포·web.app 검증 클린 패스 — 잔여: 구글시트 키 설정) |
| 규모 | XL (코드 ~25파일 + Firestore 라이브 데이터 마이그레이션) |
| 담당 역할 | 기획자 → 구현자 → 검토자 → 테스터 |

---

## 의도 (Intent)

- **비즈니스 목적**: 고객(갑)의 2차 수정 요청 6건을 반영해 사이트를 "WITHCOM AI" 브랜드로 정비하고, 콘텐츠 탐색(검색·게시판)과 문의 운영(공개 리스트·구글시트)을 강화한다.
- **성공의 모습**: ①헤더 검색으로 게시글을 찾아 이동 가능 ②AI TOOL 카드 6개 클릭 시 각 게시판 진입·어드민에서 글 등록 가능 ③홈 콘텐츠 섹션이 고정글+최신글 6개 노출 ④/contact 하단에 문의 리스트 표시+접수 시 구글시트 기록 ⑤사이트 전체(탭 타이틀 포함)에서 "위드컴정보"가 보이지 않음 ⑥홈 하단 카드가 2×2(쇼핑몰·블로그/원격지원·유튜브)로 배치.
- **판단 기준**: 기존 패턴 재사용 > 신규 발명 · 개인정보 보호 > 정보 노출량 · 라이브 데이터 안전(백업 후 마이그레이션) > 속도.

---

## 제품 검증 (Product Validation) — Phase A

### A1. 사용자 여정 맵

#### WP1 — 헤더 검색
- 진입점: 모든 페이지 헤더(데스크톱: 메뉴 우측 / 모바일: 햄버거 좌측) 돋보기 아이콘
- 화면: 검색 오버레이(모달) — 입력 즉시(디바운스 300ms) 콘텐츠·공지·지원사업·AI TOOL 게시글 제목/요약 매칭, 유형 뱃지와 함께 그룹 표시
- 성공 경로: 결과 클릭 → 해당 상세 페이지 이동, 오버레이 닫힘
- 실패 경로: 결과 0건 → "검색 결과가 없습니다" 빈 상태 / Firestore 오류 → "잠시 후 다시 시도해주세요"
- 탈출점: ESC·배경 클릭·X 버튼으로 닫기 (원래 페이지 유지)

#### WP2 — AI TOOL 게시판
- 진입점: ① /smartwork-ai "AI TOOL 소개" 6개 카드 클릭 ② 헤더 검색 결과
- 화면 1: `/ai-tools?cat={slug}` — 카테고리 탭 6개 + 해당 카테고리 게시글 카드 리스트 (콘텐츠 게시판과 동일 디자인)
- 화면 2: `/ai-tools/view?slug={slug}` — 게시글 상세 (제목·카테고리·날짜·본문 HTML)
- 어드민: `/admin/ai-tools` — 카테고리 셀렉터 포함 CRUD (admin/contents 복제)
- 실패 경로: 글 0건 카테고리 → "아직 등록된 소개 글이 없습니다" 빈 상태 / 잘못된 slug → "글을 찾을 수 없습니다" + 목록 복귀 링크
- 탈출점: 목록으로 버튼 → 카테고리 리스트 복귀

#### WP3 — 업무활용 콘텐츠 고정 노출
- 진입점: 어드민 → 업무활용 콘텐츠 → 글 편집 → "항상 노출(고정)" 체크
- 화면: 홈 CONTENTS 섹션 — 고정글 우선 + 최신순으로 총 6개(3×2 그리드) / 고정글에 "고정" 뱃지
- 실패 경로: 게시글 0건 → 기존 시드 항목 예비 표시(현행 유지)
- 탈출점: 카드 클릭 → /contents/view 상세

#### WP4 — 문의하기 개선
- 진입점: /contact (헤더 "고객 서비스 > 문의하기", 푸터 "문의")
- 화면: 문의 폼(좌측 패널: 이메일 withcomai@gmail.com만, 전화·주소 제거) → 제출 성공 시 하단 "문의 내역" 리스트에 즉시 반영
- 리스트: 공지사항형 테이블 — 유형 · 작성자(마스킹 `홍*동`) · 날짜 · 상태(접수/답변완료). **내용은 비공개**
- 구글시트: 접수 시 서버가 withcomai@gmail.com 소유 스프레드시트 "문의" 탭에 1행 추가 (기존 `appendInquiryRow` 재사용, 키 설정만 필요)
- 실패 경로: 시트 미설정 시 문의 저장은 성공·시트 동기화만 스킵(현행 동작 유지) / 리스트 로드 실패 → 리스트 영역만 숨김
- 탈출점: 제출 완료 토스트 → 폼 초기화

#### WP5 — 회사명 표기 변경 + 푸터
- 화면: 모든 페이지 — 브라우저 탭 타이틀 `WITHCOM AI | …`, 푸터 법적 고지에서 주소·전화 제거(대표·사업자등록번호 유지), 이메일 withcomai@gmail.com, © 1999 WITHCOM AI
- 메일: 문의 답변 메일 발신자명·제목·본문 "WITHCOM AI"

#### WP6 — 홈 카드 2×2
- 화면: 홈 하단 — 1행 [공식 쇼핑몰(블루) · 공식 네이버 블로그(에메랄드)] / 2행 [원격 지원 서비스(슬레이트) · 유튜브 자료실(레드)]
- 각 카드 외부 링크 새 탭 열기 (현행 동일)

### A2. 기능 완성도 감사

| 상태 | 적용 | 처리 방법 |
|------|------|----------|
| 기본 (default) | ✅ | 검색 오버레이 닫힘 상태 / 게시판 리스트 카드 그리드 / 문의 리스트 최신 10건 |
| 로딩 (loading) | ✅ | 검색: 스피너 인라인 / ai-tools·문의 리스트: 스켈레톤 or "불러오는 중" |
| 비어있음 (empty) | ✅ | 검색 0건·게시판 글 0건·문의 0건 각각 안내 문구 (WP별 A1 참조) |
| 에러 (error) | ✅ | Firestore/API 실패 시 친화적 문구 + 콘솔 로그, 페이지 전체는 동작 유지 |
| 성공 (success) | ✅ | 문의 제출 토스트(현행), 어드민 저장 토스트(현행 패턴) |
| 비활성 (disabled) | ✅ | 어드민 저장 중 버튼 비활성(현행 패턴 유지) |
| 호버/포커스 | ✅ | 검색 결과 행 hover bg / 카드 hover scale(현행 토큰) / 검색 입력 autoFocus |
| 모바일 반응형 | ✅ | 검색 오버레이 풀스크린(모바일) / 카드 그리드 1열 폴백 / 문의 리스트 가로 스크롤 없는 축약 컬럼 |
| 다크모드 | N/A | 사이트 미지원 (현행 라이트 단일) |
| i18n | N/A | 한국어 단일 — 자연스러운 한국어 카피 직접 작성 |
| 엣지 케이스 | ✅ | 이름 1자(마스킹 `홍*`)·2자(`홍*`) / 검색어 1자 미만 무시 / pinned 글 6개 초과 시 고정글만 6개 / 마이그레이션 재실행 멱등성 |
| 접근성 | ✅ | 검색 버튼 aria-label="사이트 검색" / 오버레이 ESC 닫기 / 카드 링크 시맨틱 `<a>` |

### A3. 연결점 분석

| 연결점 | 영향 여부 | 상세 |
|--------|----------|------|
| 네비게이션/사이드바 | ✅ | 헤더에 검색 버튼 추가 / 어드민 사이드바에 "AI TOOL 소개" 메뉴 추가(`ADMIN_NAV_ITEMS`) / 공개 GNB "AI TOOL 소개" 링크는 /smartwork-ai 유지 |
| 대시보드 | ⚠️ | 어드민 대시보드에 컬렉션 카운트 위젯이 있으면 aiTools 추가 검토(구현 시 확인) |
| 자동화/백그라운드 잡 | ✅ | 문의 접수 → 구글시트 append (기존 코드, 키 설정 필요) |
| API 의존성 | ✅ | 신규 `GET /api/inquiries/public` (마스킹 목록) — firestore.rules의 inquiries read:isAdmin은 유지하고 서버 Admin SDK로 우회 |
| 공유 컴포넌트 | ⚠️ | `CardsSection`(href 추가)·`ServicesSection`(2열)·`ContactSection`(연락처 축소)은 여러 페이지에서 공유 — cards는 모든 cards 섹션에 영향(href 없으면 현행 동일), ContactSection은 홈+contact 공용이므로 문의 리스트는 `showList` 플래그로 contact만 노출 |
| 설정 의존성 | ✅ | 구글시트 3키(`googleSheetsServiceAccountEmail/PrivateKey/InquiryId`) — 어드민 → 외부 서비스 키 |
| i18n | N/A | — |
| 테스트 레퍼런스 | ✅ | `docs/test-plans/second-revision-request.md` 신규 작성 후 테스트 진입 |

### A4. 상용 준비도

| 기준 | 통과 | 비고 |
|------|------|------|
| 데모 가능 | ✅ | 각 WP 독립 데모 가능 — AI TOOL 게시판은 시드 글 1건씩 등록해 빈 상태 회피 |
| 플레이스홀더 없음 | ✅ | placeholder "(주)위드컴정보" → "WITHCOM AI" 교체 포함 |
| 데드 링크 없음 | ✅ | 카드 href 6개 전부 실제 게시판으로 연결 + 마이그레이션으로 라이브 데이터 동기화 |
| 깨진 플로우 없음 | ✅ | 검색→상세, 카드→게시판→상세→목록 복귀 전 구간 연결 |
| 2초 이내 로딩 | ✅ | 검색은 published 문서만 클라이언트 fetch(현 데이터량 소규모) — 캐시(lib/firestore 캐시) 재사용 |
| 빈 상태 안내 | ✅ | A2 참조 |
| 라벨 명확성 | ✅ | "항상 노출(고정)" 체크박스 / 문의 상태 "접수·답변완료" 2단계 단순화 |

### A5. 서비스 품질

| 기준 | 통과 | 비고 |
|------|------|------|
| 온보딩 안내 | ✅ | 어드민 AI TOOL 페이지 상단에 한 줄 설명("스마트워크&AI 페이지의 6개 카드와 연결됩니다") |
| 에러 메시지 친화적 | ✅ | 한국어 자연문, 기술 용어 금지 |
| 로딩 인디케이터 | ✅ | A2 참조 |
| 성공 피드백 | ✅ | 현행 토스트 패턴 재사용 |
| 모바일 사용성 | ✅ | 검색 오버레이 모바일 풀스크린, 2×2 카드는 모바일 1열 |
| 파괴적 동작 확인 모달 | ✅ | 어드민 글 삭제 확인(현행 패턴 복제) |

### A6. 완결성 사고 (너트-볼트)

- 진입 경로: 검색 버튼(전 페이지) · AI TOOL 카드 6개 href · 어드민 사이드바 "AI TOOL 소개" · /contact 하단 리스트
- 결과 확인: 어드민에서 쓴 AI TOOL 글 → 공개 게시판 즉시 반영(클라이언트 렌더) · 문의 제출 → 하단 리스트 + 구글시트 행 + 어드민 문의함
- 복귀 경로: 게시글 상세 → "목록으로"(카테고리 유지) · 검색 닫기 → 원래 페이지
- 에러 안내: 시트 미설정 시 문의 저장은 정상 처리(시트만 스킵, 어드민 외부 서비스 키 화면에 안내 존재)
- 함께 만들어야 하는 것: ①firestore.rules `aiTools` 블록+배포 ②COLLECTIONS 상수 ③검색 인덱스 대상에 aiTools 포함 ④마이그레이션 스크립트(라이브 pages 데이터: 카드 href·services 4카드·회사명 치환·contact 섹션 email/showList) ⑤시드 데이터 동기화(seed-data.ts)

### A7. 디자인 의도

- 워딩 톤: 간결·신뢰형. 예) 검색 placeholder "찾으시는 콘텐츠를 검색해보세요" / 빈 상태 "아직 등록된 소개 글이 없습니다"
- 정보 계층: 게시판 리스트 = 카테고리 뱃지(블루 필) > 제목(bold) > 요약(회색 2줄 클램프) — 콘텐츠 게시판과 동일 토큰
- 여백·정렬: 기존 섹션 스케일(py-16 sm:py-24, max-w-[1400px], rounded-2xl/3xl) 준수
- 신규 블로그 카드: `bg: emerald`(기존 BG 맵에 정의 존재) + BookOpen 아이콘 — /youtube 페이지 녹색 배너와 색상 일관

---

## 기술 명세 (Phase B)

### 범위

- **포함**: 위 WP1~WP6 전체, firestore.rules 1블록 추가, Firestore 라이브 데이터 마이그레이션 스크립트(백업 포함), 시드 데이터 동기화, 테스트 플랜 작성
- **제외**: 구글시트 실제 키 발급·시트 생성(사용자 협조 후 설정) · Algolia 등 풀텍스트 검색 엔진 도입(클라이언트 필터로 충분) · 푸터 대표자·사업자등록번호 삭제(법적 고지 유지) · /youtube 페이지 구조 변경 · 문의 내용 본문 공개

### 수용 기준 (검증 가능)

- [ ] `npm run build` 성공 (typecheck 포함)
- [ ] WP1: 아무 페이지에서 검색 아이콘 클릭 → "AI" 입력 → 게시글 결과 표시 → 클릭 시 상세 이동
- [ ] WP2: /smartwork-ai 카드 6개 각각 클릭 → `/ai-tools?cat=…` 게시판 도달, 어드민에서 글 작성 → 공개 게시판·상세 노출
- [ ] WP3: 어드민에서 글 1개 "항상 노출" 체크 → 홈 CONTENTS 섹션에 고정 뱃지와 함께 최대 6개 노출
- [ ] WP4: /contact 좌측 패널에 전화·주소 없음, 이메일 withcomai@gmail.com / 폼 제출 → 하단 리스트에 `유형·홍*동·날짜·접수` 행 추가 / (키 설정 후) 구글시트 행 추가
- [ ] WP5: 브라우저 탭 타이틀·푸터·메일 템플릿·전 페이지 본문에서 "위드컴정보" 0건 (`grep` + 라이브 페이지 육안)
- [ ] WP6: 홈 하단 카드 2×2 — 1행 쇼핑몰·블로그 / 2행 원격지원·유튜브, 4링크 모두 정상
- [ ] P1 (빈 상태): AI TOOL 글 0건 카테고리 → 빈 상태 문구 / 검색 0건 → 안내
- [ ] P2 (에러 상태): /api/inquiries/public 실패 시 /contact 페이지 폼은 정상 동작, 리스트 영역만 미노출
- [ ] P3 (모바일 390px): 검색 오버레이 풀스크린 동작 / 홈 카드 1열 / 문의 리스트 컬럼 축약
- [ ] 마이그레이션: 실행 전 `siteSettings` 백업 JSON 생성 확인, 2회 실행해도 결과 동일(멱등)

### 영향 파일 목록

| # | 파일 | 신규/수정 | 변경 의도 |
|---|------|----------|----------|
| 1 | `src/types/cms.ts` | 수정 | `CardItem.href?` · `ContentDoc.pinned?` · `ContactSectionData.showList?` · `AiToolDoc`/`AiToolCategory` 추가 |
| 2 | `src/lib/constants.ts` | 수정 | SITE_NAME="WITHCOM AI" · COMPANY.email 교체 · `AI_TOOL_CATEGORIES` 상수 · ADMIN_NAV_ITEMS에 AI TOOL 추가 |
| 3 | `src/lib/firestore.ts` | 수정 | `COLLECTIONS.AI_TOOLS: "aiTools"` 추가 |
| 4 | `firestore.rules` | 수정 | `aiTools` read:true / write:isAdmin 블록 |
| 5 | `src/components/layout/Nav.tsx` | 수정 | 검색 아이콘 버튼(데스크톱·모바일) + SearchOverlay 마운트 |
| 6 | `src/components/layout/SearchOverlay.tsx` | 신규 | 통합 검색 오버레이 (contents·notices·smeSupport·aiTools) |
| 7 | `src/components/sections/CardsSection.tsx` | 수정 | `item.href` 있으면 Link/a 래핑 (없으면 현행 그대로) |
| 8 | `src/components/sections/ServicesSection.tsx` | 수정 | 그리드 `md:grid-cols-2` + BookOpen 아이콘 등록 |
| 9 | `src/components/sections/BlogSection.tsx` | 수정 | auto 모드: pinned 우선+최신순 6개, 고정 뱃지 |
| 10 | `src/components/sections/ContactSection.tsx` | 수정 | 전화·주소 행 제거(이메일만) + `showList` 시 하단 InquiryList |
| 11 | `src/components/sections/InquiryList.tsx` | 신규 | 공개 문의 리스트 (마스킹·상태 뱃지) |
| 12 | `src/components/sections/InquiryForm.tsx` | 수정 | placeholder "WITHCOM AI" + 제출 성공 시 리스트 갱신 이벤트 |
| 13 | `src/app/api/inquiries/public/route.ts` | 신규 | GET — Admin SDK로 최신 10건 마스킹 반환 (개인정보 필드 제외) |
| 14 | `src/app/(public)/ai-tools/page.tsx` | 신규 | 카테고리 탭 게시판 리스트 (contents 리스트 복제) |
| 15 | `src/app/(public)/ai-tools/view/page.tsx` | 신규 | 게시글 상세 (contents/view 복제) |
| 16 | `src/app/admin/ai-tools/page.tsx` | 신규 | CRUD (admin/contents 복제 + 카테고리 셀렉터) |
| 17 | `src/app/admin/contents/page.tsx` | 수정 | "항상 노출(고정)" 체크박스 + 목록 고정 뱃지 |
| 18 | `src/app/(public)/contents/page.tsx` | 수정 | 고정글 상단 정렬 + 뱃지 (연쇄 반영) |
| 19 | `src/components/layout/Footer.tsx` | 수정 | 주소·전화 행 삭제, 이메일 교체 (대표·사업자번호 유지) |
| 20 | `src/lib/mail.ts` | 수정 | 발신자명·제목·본문 "위드컴정보" → "WITHCOM AI" |
| 21 | `src/lib/seed-data.ts` | 수정 | 회사명 치환 · sw-tools 카드 href · home-services 4카드 |
| 22 | `src/app/(public)/notice/page.tsx` · `shop/page.tsx` · `login/page.tsx` | 수정 | 노출 문구 회사명 치환 |
| 23 | `src/app/api/ai/*.ts` (3파일) | 수정 | AI 프롬프트 내 회사명 기준 갱신 |
| 24 | `scripts/migrate-revision2.ts` | 신규 | 라이브 Firestore 마이그레이션 (백업→치환→카드 href→services 4카드→contact email/showList) |
| 25 | 어드민 페이지·섹션 에디터 (`src/components/admin/*` 중 contact·cards 폼) | 수정 | cards 항목 href 입력란 추가 · contact 전화/주소 입력란 정리 (구현 시 해당 파일 특정) |

### 구현 명세 (핵심 파일별)

#### `src/types/cms.ts`
- **변경 의도**: 신규 데이터 모델과 옵션 필드 추가 (기존 문서와 하위호환 — 전부 optional)
- **핵심 변경점**:
  - `CardItem`에 `href?: string` (cards 섹션 카드 링크)
  - `ContentDoc`에 `pinned?: boolean`
  - `ContactSectionData`에 `showList?: boolean`
  - `AiToolCategory = "ai-assistant" | "collaboration" | "cloud-office" | "automation" | "data-analysis" | "customer-ai"`
  - `AiToolDoc` = ContentDoc 구조 + `category: AiToolCategory` (title·slug·thumbnail·summary·bodyHtml·status·publishedAt·viewCount·authorEmail)
- **제약**: 기존 문서 파싱 깨지지 않도록 모두 optional / union 확장만

#### `src/components/layout/SearchOverlay.tsx` (신규)
- **변경 의도**: 사이트 통합 검색
- **목표 상태**: 열릴 때 4컬렉션 published 문서 fetch(lib/firestore 캐시 재사용) → 메모리 인덱스 → 입력 디바운스 300ms 필터(제목·요약·카테고리 includes, 대소문자 무시) → 유형 뱃지(콘텐츠/공지/지원사업/AI TOOL) 그룹 결과 → 클릭 시 해당 경로 push 후 닫기
- **경로 매핑**: contents→`/contents/view?slug=` · notices→`/notice`(목록, 항목 강조는 추후) · smeSupport→`/sme-support/{category}` · aiTools→`/ai-tools/view?slug=`
- **제약**: 서버 의존 없음(클라이언트 전용) · body 스크롤 잠금 · ESC/배경 닫기 · 모바일 풀스크린

#### `src/app/(public)/ai-tools/page.tsx` + `view/page.tsx` + `src/app/admin/ai-tools/page.tsx` (신규 3종)
- **변경 의도**: 6개 카테고리 게시판 (기존 contents 3종 페이지 복제·치환)
- **목표 상태**: 리스트는 `?cat=` 쿼리(기본: 첫 카테고리) + 상단 카테고리 탭(가로 스크롤 가능 필 버튼) / 상세는 `?slug=` / 어드민은 카테고리 셀렉터+상태+게시일 (admin/contents UI 패턴 동일)
- **제약**: Suspense로 useSearchParams 감싸기(기존 contents/view 패턴 확인 후 동일 적용) · 빈 상태/로딩/에러 3종 처리

#### `src/components/sections/BlogSection.tsx`
- **현재 → 목표**: `slice(0, 3)` 최신 3개 → `pinned` 우선(고정 내 최신순) + 나머지 최신순 채움, 총 `slice(0, 6)` / 카드 썸네일 위 "고정" 뱃지(블루 필, category 뱃지 우측)
- **제약**: 게시글 0건 시 시드 items 폴백(현행 유지) · grid는 `md:grid-cols-3` 유지(2행 자동)

#### `src/app/api/inquiries/public/route.ts` (신규)
- **변경 의도**: 개인정보 안전한 공개 문의 리스트
- **목표 상태**: GET → Admin SDK로 `inquiries` 최신 10건 → `{ type, maskedName, createdAt, answered }`만 반환. `maskedName` = 첫 글자 + `*` + (3자 이상이면 마지막 글자). `answered` = status가 answered/closed. 캐시 `no-store`
- **제약**: name·email·phone·message·company 원문 절대 미반환 / 인증 불필요(공개) / 실패 시 5xx — 클라이언트는 영역 숨김

#### `scripts/migrate-revision2.ts` (신규)
- **변경 의도**: 코드 배포와 라이브 Firestore 데이터 정합 맞춤 (scripts/seed.ts와 동일 인증 패턴)
- **단계**: ① `siteSettings` 전 문서 JSON 백업(`scripts/backup-YYYYMMDD.json`) ② page_* 문서 내 문자열 치환("주식회사 위드컴정보"→"WITHCOM AI", "(주)위드컴정보"→, "위드컴정보"→ 순서) — seoTitle/seoDescription 포함 깊은 순회 ③ page_smartwork-ai의 sw-tools 카드 6개에 제목 매칭으로 `href` 부여 ④ page_home의 home-services items를 4카드(쇼핑몰·블로그·원격지원·유튜브 순)로 교체 ⑤ page_home·page_contact의 contact 섹션 `email: "withcomai@gmail.com"` 설정, phone·address 키 제거, contact 페이지만 `showList: true` ⑥ globalSettings(global) 문서의 defaultSeoTitle 등 치환
- **제약**: integrations 문서 제외 · 멱등(재실행 무해) · dry-run 플래그(`--dry`) 지원 · 실행 로그로 변경 문서 목록 출력

#### `src/components/layout/Nav.tsx`
- **목표 상태**: 데스크톱 — 메뉴 우측(로그인 버튼 왼쪽)에 Search 아이콘 버튼 / 모바일 — 햄버거 왼쪽에 동일 버튼. 클릭 시 `<SearchOverlay open onClose>` 렌더
- **제약**: 기존 드롭다운·로그인 로직 불변 · 아이콘 lucide `Search`

#### `src/components/sections/ContactSection.tsx`
- **현재 → 목표**: Info 3행(전화·이메일·주소) → 이메일 1행만. `data.showList === true`이면 섹션 하단(흰 카드 아래)에 `<InquiryList />` 렌더
- **제약**: 홈의 contact 섹션은 showList 미설정 → 리스트 미노출 (홈 영향 0)

### 연쇄 반영 체크리스트

- [ ] API ↔ UI: /api/inquiries/public ↔ InquiryList / 문의 제출 성공 → 리스트 refetch
- [ ] DB ↔ 서비스: aiTools 컬렉션 ↔ rules ↔ COLLECTIONS ↔ 검색 인덱스 / `npm run deploy:rules` 배포
- [ ] 데이터 마이그레이션: 코드 push·롤아웃 **후** migrate-revision2 실행 (구버전 클라이언트가 href 없는 카드 렌더해도 무해 — CardsSection 하위호환이므로 순서 무관하나, 치환은 롤아웃 후 권장)
- [ ] 타입/Props 전파: CardItem.href → 어드민 cards 에디터 입력란 / ContentDoc.pinned → 어드민 폼·목록
- [ ] 시드 동기화: seed-data.ts ↔ 라이브 데이터 동일 상태
- [ ] 문서 동기화: docs/progress.md 압축 블록 + docs/test-plans/second-revision-request.md
- [ ] grep 검증: 빌드 후 `grep -rn "위드컴정보" src/` 사용자 노출 문자열 0건

### 롤백 계획

- 코드: `git revert` (단일 커밋 단위로 WP 그룹 커밋) → push → 수동 롤아웃
- 데이터: 마이그레이션 ①에서 만든 백업 JSON으로 `siteSettings` 복원 스크립트(`--restore` 플래그) / aiTools 컬렉션은 추가형이라 방치 무해
- rules: 이전 rules 재배포 (`git checkout HEAD~1 firestore.rules && npm run deploy:rules`)

### 작업 단계 체크리스트 (구현 순서)

- [x] 1. 타입·상수·rules 기반 작업 (#1~4) — 빌드 확인
- [x] 2. WP5+WP6+WP4c·d: 표기 치환·푸터·ContactSection·ServicesSection·seed-data (코드만)
- [x] 3. WP3: pinned (타입→어드민→BlogSection→/contents)
- [x] 4. WP2: AI TOOL 게시판 3페이지 + CardsSection href + 어드민 사이드바
- [x] 5. WP4a: /api/inquiries/public + InquiryList + ContactSection showList
- [x] 6. WP1: SearchOverlay + Nav
- [x] 7. 마이그레이션 스크립트 작성 + 로컬 dry-run ✅ (변경 1건 = page_contact — page_home·smartwork-ai는 Firestore 미존재로 시드 폴백, 배포만으로 반영됨)
- [x] 8. 빌드 → 로컬 E2E(Playwright) → 커밋(2fe7c14) → push → 롤아웃 SUCCEEDED(rollout-2026-06-11-001, push 자동 트리거 — 수동 명령은 충돌했으나 자동 성공 확인)
- [x] 9. rules 배포(`firebase deploy --only firestore:rules` — storage 미설정으로 deploy:rules 스크립트 대신) → 마이그레이션 실행(백업 생성, page_contact 반영) → web.app 전체 검증 26/26 클린 패스
- [ ] 10. WP4b: 구글시트 — 사용자 협조(시트 준비) 후 어드민 키 설정 → 실문의 1건 시트 기록 확인
- [x] 11. 원본 지시 검증 테이블 출력 완료 (반영은 /reflect 별도)

### 사용자 협조 필요 (블로커 아님 — 10단계에서)

1. **구글시트**: withcomai@gmail.com 계정으로 스프레드시트 1개 생성("문의" 시트 탭) → 서비스 계정 이메일에 편집자 공유 → 시트 ID 전달 (상세 가이드는 구현 후 제공)
2. **AI TOOL 초기 글**: 카테고리별 소개 글 원고(없으면 어드민에서 직접 입력 가능한 상태로 인계)

---

## 품질 평가 결과

> 구현·검토 후 기록

- 평가일: 2026-06-11
- 등급: 통과 (web.app E2E 26/26 클린 패스)
- A 코드 품질: 5/5 — strict 타입(any 없음)·기존 패턴 복제(contents 게시판/cmdk)·한글 주석·하위호환 optional 필드
- C 보안: 4/4 — 공개 문의 API는 마스킹 필드만 반환(원문 미노출), inquiries rules read:isAdmin 유지, aiTools write:isAdmin, 시크릿 로컬 파일 미보관(백업에서 integrations 제외, 임시 ADC 0600+종료시 삭제)
- 미달 항목: 없음. 잔여 작업: 구글시트 키 설정(사용자 협조) · E2E 테스트 문의 1건 어드민에서 삭제 가능
