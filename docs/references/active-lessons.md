# active-lessons.md — 최근 30일 활성 경고

> **모든 에이전트가 작업 시작 전 필수로 읽는 경량 경고 목록.**
> 실수/버그/품질 위반 발견 시 **즉시** 추가 (반영자 기다리지 말 것).
> 1회 발생 = 즉시 추가. 보안·안정성 패턴은 AGENTS.md에 즉시 영구 승격.
> 만료(30일) 항목은 반영자가 주간 정리 시 제거하거나 lessons.md로 승격.

---

<!-- 새 경고는 이 아래에 추가. 형식:

## YYYY-MM-DD | {에이전트명} | {패턴 한줄 요약}
- **패턴**: {어떤 상황에서 발생하는가}
- **차단 방법**: {다음에 어떻게 피하는가}
- **만료**: {30일 후 날짜}

-->

## 2026-07-03 | 테스터 | Playwright 헤드풀에서 폼 submit 버튼 click()이 디스패치 후 행업 — 그런데 제출은 성공함
- **패턴**: web.app 문의 폼에서 `locator.click()`이 클릭 자체는 성공시키고도 리턴하지 않아 워치독까지 행업. 행업을 실패로 보고 재시도하면 **중복 제출**됨(실제 3건 쌓임).
- **차단 방법**: ① 제출은 `page.evaluate(() => btn.click())`(JS 클릭)으로. ② 응답 확인은 `waitForResponse` await 대신 `page.on('response')` 리스너 + 성공 UI 문구("전송 완료") 폴링. ③ 행업/타임아웃 후 재시도 전 **서버 로그·DB에서 이전 시도가 실제 실패했는지 확인**.
- **만료**: 2026-08-02

## 2026-07-03 | 테스터 | Tailwind v4 색상 검증은 rgb 문자열 비교 불가 — lab()/oklch 반환 + v3 hex와 값 자체가 다름
- **패턴**: `getComputedStyle().backgroundColor`가 `lab(...)`으로 나오고, v4 blue-600을 캔버스로 픽셀화하면 [21,93,252]로 v3 hex #2563eb=[37,99,235]와 다름 → 정확값 비교는 항상 FAIL.
- **차단 방법**: 클래스 적용 여부 + 캔버스 픽셀의 **색 계열 판정**(예: B>200 && R<80)으로 검증. 스크린샷 시각 확인 병행.
- **만료**: 2026-08-02

## 2026-07-03 | 구현자 | createDoc/서버 serverTimestamp로 저장된 createdAt을 new Date()로 파싱하면 Invalid Date
- **패턴**: 타입은 `createdAt?: string`인데 실제 저장은 Firestore Timestamp 객체(lib/firestore.ts createDoc이 ISO 문자열을 serverTimestamp로 덮어씀) → 어드민 문의·피드백 목록 전부 Invalid Date, JSX에 객체 직접 렌더 시 크래시 위험.
- **차단 방법**: 날짜 표시는 항상 `formatDateTime()`(lib/utils.ts — Timestamp·ISO·number 모두 처리) 사용. 저장 포맷 변경은 기존 문서와 orderBy 타입 혼합 문제로 금지.
- **만료**: 2026-08-02

## 2026-07-03 | 테스터 | 라이브 메일 기능은 SMTP 자격증명 미설정 상태 — 코드가 아니라 설정이 원인
- **패턴**: 문의 알림·답변 메일이 `SMTP 계정·비밀번호가 설정되지 않았습니다`로 실패. siteSettings/integrations엔 Google Sheets 키만 존재.
- **차단 방법**: 메일 관련 작업 전 integrations 문서에 smtpUser/smtpAppPassword 존재 확인(Firestore REST). 설정은 사용자만 가능(Gmail 앱 비밀번호 발급 필요).
- **만료**: 2026-08-02

## 2026-06-15 | 배포자 | 커스텀 도메인 검증 전부 ACTIVE인데 "Site Not Found" → `firebase deploy --only hosting` 재배포
- **패턴**: customDomain이 ownership/host/cert 모두 ACTIVE인데도 실제 접속 시 Firebase "Site Not Found"(404). web.app는 정상. 엣지 전파 지연으로 오판하기 쉬우나 30분+ 지속.
- **원인/차단**: Firebase Hosting이 새 커스텀 도메인에 현재 release를 바인딩하지 않은 상태. `firebase deploy --only hosting`로 release를 다시 내면 모든 연결 도메인에 즉시 적용되어 해결(이 프로젝트는 rewrites만 있는 hosting이라 비파괴적). 사용자 브라우저엔 이전 404가 캐시될 수 있으니 강력 새로고침 안내.
- **만료**: 2026-07-15

## 2026-06-15 | 배포자 | 커스텀 도메인 추가/삭제는 legacy domains API 불가 → customDomains API
- **패턴**: `DELETE .../sites/{site}/domains/{domain}`(legacy)는 500 "Domains deletion approach ... not supported"로 실패.
- **차단 방법**: `DELETE .../projects/{projectNumber}/sites/{site}/customDomains/{domain}?allowMissing=true`(삭제) / `POST .../customDomains?customDomainId={domain}` body `{}`(추가). 추가 후 `GET .../customDomains/{domain}`의 `requiredDnsUpdates.desired`에서 필요 레코드 산출. customDomains 경로는 `projects/-`가 아닌 **projectNumber(345857326079)** 필요.
- **이 프로젝트 apex DNS**: A=199.36.158.100(단일) + TXT `hosting-site=withcomai-web`, www는 CNAME→withcomai-web.web.app.
- **만료**: 2026-07-15

## 2026-06-11 | 테스터 | E2E 셀렉터: `has-text` 부분일치가 헤더 드롭다운·푸터 동명 링크를 오염 매칭
- **패턴**: `a:has-text("공식 쇼핑몰")` 같은 전역 로케이터가 GNB 드롭다운의 "공식 쇼핑몰 바로가기"(visibility:hidden — boundingBox는 반환됨)나 푸터 링크를 first()로 잡아 위양성/위음성 발생. 모바일에선 데스크톱용 숨김 버튼(`hidden lg:flex` 내부)이 매칭돼 click 타임아웃.
- **차단 방법**: 항상 섹션 스코프(`section:has(...)`) 또는 `:visible` 한정으로 매칭. nav 검증은 `page.locator('nav')` 범위 한정.
- **만료**: 2026-07-11

## 2026-06-11 | 배포자 | push 직후 수동 롤아웃이 자동 롤아웃과 충돌(Conflict for resource)
- **패턴**: ABIU(자동 빌드) 활성 백엔드에서 `git push` 직후 `apphosting:rollouts:create` 실행 시 "version ... was specified but current version is ..." 충돌 — push가 트리거한 자동 롤아웃이 이미 진행 중. 수동 롤아웃 실패가 곧 배포 실패는 아님.
- **차단 방법**: 충돌 에러 시 REST로 롤아웃 상태 확인(`GET https://firebaseapphosting.googleapis.com/v1beta/.../backends/withcomweb/rollouts` — firebase CLI refresh_token 토큰 교환). 최신 롤아웃이 BUILDING/SUCCEEDED면 그것을 추적, FAILED일 때만 수동 재시도.
- **보완(2026-06-12)**: rollouts/builds **목록 API의 기본 정렬은 최신순이 아니다** — `pageSize=1`로 첫 항목만 보면 옛 롤아웃이 반환돼 "자동 롤아웃 누락"으로 오판한다(실제 de560da는 02:40 자동 롤아웃 성공). 반드시 `pageSize=200`으로 받아 createTime 정렬 후 판단. 수동 롤아웃은 이름이 `build-YYYY-…` 형식으로 생성되니 이름 패턴 매칭도 주의.
- **만료**: 2026-07-11

## 2026-06-11 | 구현자 | 클라 SDK는 undefined 필드값에서 addDoc/setDoc throw — 신규 초안 저장 전멸
- **패턴**: `payload = { ...doc, publishedAt: cond ? x : doc.publishedAt }` 식으로 만들면 미발행 신규 글에서 `publishedAt: undefined` 키가 생기고, **클라이언트 Firestore SDK는 undefined 값을 거부**해 저장이 통째로 실패한다 (admin SDK는 ignoreUndefinedProperties로 통과해 어드민/서버에선 재현 안 됨).
- **차단 방법**: 클라에서 쓰기 전 undefined 키 제거(`Object.keys().forEach(k => payload[k]===undefined && delete payload[k])`). orderBy(필드)도 필드 없는 문서를 제외하므로 어드민 목록은 전체 조회 후 클라 정렬.
- **만료**: 2026-07-11

## 2026-06-11 | 구현자 | Storage rules의 firestore.get(isAdmin)은 cross-service IAM 없으면 전부 deny
- **패턴**: storage.rules에서 `firestore.get()`으로 role을 확인하는데, Storage 서비스 에이전트(service-{N}@gcp-sa-firebasestorage)에 `roles/datastore.viewer`가 없으면 해당 규칙 평가가 모두 실패 → 업로드/조회가 unauthorized. 버킷을 콘솔 밖(REST)에서 만들면 이 권한이 자동 부여되지 않는다.
- **차단 방법**: 버킷 신설 시 `cloudresourcemanager setIamPolicy`로 datastore.viewer 부여 확인. 또한 "업로드 직후 getDownloadURL"은 read 규칙도 통과해야 함 — 업로더가 읽을 수 없는 경로(isAdmin read)에 업로드시키면 안 됨.
- **만료**: 2026-07-11

## 2026-06-11 | 테스터 | bgImage형 BannerHero는 텍스트가 아닌 이미지(alt)로 렌더 — 텍스트 매칭 불가
- **패턴**: `HeroSection` banner variant는 bgImage 지정 시 `<img alt={title}>`만 출력(타이틀 텍스트 노드 없음). E2E에서 `text=...` 매칭·innerText 검사가 실패하고, page 소스 grep은 RSC 페이로드에 걸려 위양성.
- **차단 방법**: 이미지 배너 검증은 `img[alt*="..."]` + 스크린샷. 렌더 여부를 소스 grep으로 판단할 땐 출현 횟수(렌더+페이로드=2회 이상)로 구분.
- **만료**: 2026-07-11

## 2026-06-11 | 배포자 | `npm run deploy:rules`가 storage 미설정 프로젝트에서 실패
- **패턴**: deploy:rules 스크립트가 `firestore:rules,storage`를 함께 배포하는데 이 프로젝트는 Firebase Storage 미설정이라 storage 단계에서 전체 실패.
- **차단 방법**: rules만 배포할 땐 `firebase deploy --only firestore:rules` 사용.
- **만료**: 2026-07-11
