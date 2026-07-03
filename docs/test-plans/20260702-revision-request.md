# 테스트 플랜 — 수정요청 20260702 (노션)

> 원본: https://gleaming-dracorex-303.notion.site/2026-7-2-39176f34764080ccb45ce8279f6e21e8
> 대상: https://withcomai-web.web.app (라이브) · 계정: `.env.local` TEST_ACCOUNT_* (superadmin)

## 요구사항 → 테스트 항목

| # | 요구사항 | 테스트 방법 | 판정 기준 |
|---|---------|------------|----------|
| 가-1 | 상단 메뉴 반전 색상 검정→블루 | 홈 접속 → 활성 메뉴 pill 배경색 계산값 확인 + 스크린샷 | `bg-blue-600`(rgb(37,99,235)) 적용, slate-900 아님 |
| 나-1a | 문의 시각(일시) 표시 | 어드민 로그인 → /admin/inquiries → 시각 컬럼 | "Invalid Date" 0건, `YYYY. M. D. 오전/오후 h:mm:ss` 형식 |
| 나-1b | 문의 등록 시 withcomai@gmail.com 메일 | 공개 문의 폼으로 [자동검증] 문의 제출 → API 200 + 서버 로그에 메일 실패 로그 없음 | 접수 성공 + 메일 오류 없음 (수신함 확인은 사용자 몫) |
| 나-2a | 관리자 권한 설정변경 동작 | /admin/users 에서 role 드롭다운 변경 → 새로고침 후 유지 확인 | 변경값이 저장·유지됨 |
| 나-2b | 유충식(csyoo22@gmail.com) admin→superadmin | 나-2a 테스트를 해당 계정으로 수행 (요청 반영 = 테스트) | 새로고침 후 superadmin 유지 |
| 다-1 | 쇼핑몰 상품설명 HTML 입력 가능? | 코드 수정 아님 — 런모아(외부 플랫폼) 관리자 화면. 보고서에 답변 | 답변 제공 |
| 회귀 | 피드백 페이지 시각 (연쇄 수정) | /admin/feedback 시각 표시 확인 | "Invalid Date" 0건 |

## 결과 (2026-07-03 실행 — 라이브 web.app, 클린 패스)

| # | 결과 | 근거 |
|---|------|------|
| 가-1 | ✅ PASS | 활성 pill 픽셀 RGB [21,93,252] = Tailwind v4 blue-600, slate-900 잔존 0 |
| 나-1a | ✅ PASS | Invalid Date 0건, `2026. 7. 3. 오후 11:55:38` 형식 표시, 상세 모달 정상 |
| 나-1b | ⚠️ 코드 배포 완료·자격증명 대기 | 접수 API 200 + 메일 발송 코드 실행 확인. 단 서버 로그 `SMTP 계정·비밀번호가 설정되지 않았습니다` — **어드민 → 외부 서비스 키에 Gmail smtpUser/smtpAppPassword 입력 필요** (기존 답변메일 기능도 동일 상태였음) |
| 나-2a | ✅ PASS | superadmin으로 role 드롭다운 변경 → 새로고침 후 유지 |
| 나-2b | ✅ PASS | csyoo22@gmail.com admin→superadmin 변경·유지 확인 (재로그인 불필요 — requireAdmin·AuthContext 모두 users 문서 role 참조) |
| 다-1 | 📋 답변 제공 | 런모아 플랫폼(외부) — 보고서 참조 |
| 회귀 | ✅ PASS | /admin/feedback Invalid Date 0건 |

테스트 문의 3건([자동검증] 메일알림)은 Firestore에서 삭제 완료. Google Sheets에 동기화된 테스트 행은 남아 있음(수동 삭제 가능).

## 주의
- networkidle 금지 → domcontentloaded + waitForTimeout
- 문의 상세 모달: 기존엔 Timestamp 객체 직접 렌더로 크래시 위험 → 상세 열기까지 확인
- 테스트 문의는 `[자동검증]` 접두사로 생성 (어드민에서 식별·삭제 가능)
