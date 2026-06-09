# RELIABILITY.md — 배포 안정성 가이드

> 런타임 제약·배포 실패 대응·롤백의 **단일 원천**. 프로젝트 런타임에 맞게 채운다.
> 즉시 검증 가능한 단순 플랫폼이면 이 문서를 크게 간소화해도 된다.

---

## 런타임 핵심 제약

> Firebase App Hosting (SSR · Cloud Run · asia-east1), web.app은 Firebase Hosting 프록시 환경에서 절대 하면 안 되는 것들. 프로젝트별로 채운다.

- 빌드 샌드박스에서 Firestore egress 차단(빌드시 Firestore 못 읽음 — 콘텐츠는 클라이언트 렌더) · gcloud 미설치(IAM/API활성화/로그는 firebase refresh_token 으로 REST 직접) · App Hosting 자동 롤아웃 불안정 → push 후 수동 롤아웃 필수 · Firebase Hosting CDN 이 페이지를 1년 캐시 → firebase.json no-store 헤더로 차단 · 커스텀토큰 서명에 컴퓨트 SA serviceAccountTokenCreator IAM 필요
- 예) Cloudflare Workers: Node.js `fs`/`path` 사용 불가 → Web Crypto API. 환경변수는 `process.env` 대신 바인딩 접근
- 예) 특정 npm 패키지는 `serverExternalPackages` 등록 필수 — 누락 시 cold-start 크래시

---

## 배포 실패 대응 (403(Cloud Run invoker 미부여), 500(SSR/Firestore 권한·firebase-admin 로드), cold start)

1. 경쟁 배포 프로세스 kill
2. 런타임 제약 위반 여부 확인 (위 §런타임 핵심 제약)
3. 재배포
4. 여전히 실패 → 로그 수집 (`Cloud Logging REST(entries:list, resource service_name="withcomweb") — gcloud 없어 firebase 토큰으로 직접 호출 (deploy-setup 메모리 참조)`) → 원인 격리

---

## 롤백 프로토콜

배포 후 프로덕션 비정상 감지 시:

```bash
# 1. 직전 정상 커밋으로 즉시 롤백
git revert HEAD && git push origin main && firebase apphosting:rollouts:create withcomweb --git-branch main --force      # 예: git revert HEAD --no-edit && npm run deploy

# 2. 헬스체크
curl -s -o /dev/null -w "%{http_code}" https://withcomai-web.web.app/login   # 200 확인

# 3. 복구 실패 5회 초과 → 사용자 에스컬레이션
```

- 직전 성공 커밋 SHA를 항상 로그에 남긴다 (`git log --format="%h" --skip=1 -1`)
- 롤백은 "되돌리기"이지 "새 수정"이 아니다 — 원인 분석은 dev에서 별도 진행

---

## 배포 안전 규칙

- **dev 먼저, main 나중** — 모든 변경은 dev에서 검증 후 `메인적용`으로만 프로덕션 반영
- **자동 배포 가드** — `main` 브랜치 커밋만 프로덕션 자동 배포 (post-commit 훅)
- **머지 가드** — `/tmp/withcomai-allow-merge` sentinel 없이는 main push/머지 차단 (pre-push/pre-merge-commit 훅)
- **DB 마이그레이션** — nullable 컬럼으로 점진 롤아웃, 파괴적 `ALTER`는 별도 검증

---

## 변경 이력

- {YYYY-MM-DD} — 초기 작성
