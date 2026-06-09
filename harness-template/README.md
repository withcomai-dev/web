# 에이전트 개발 하네스 템플릿 (Agent Development Harness)

> **무엇인가**: AI 코딩 에이전트(Claude Code 등)가 **사람 개입을 최소화하면서 일관된 고품질**로
> 개발·검토·테스트·배포·학습하도록 강제하는 규칙·역할·명령·프로토콜의 집합.
>
> 이 폴더는 특정 프로젝트(마케팅 SaaS)에서 실전 검증된 하네스를 **프로젝트 비종속**으로 일반화한
> 이식용 템플릿이다. 빈칸(`{{...}}`)만 채우면 어떤 코드베이스에도 그대로 적용된다.

---

## 핵심 아이디어 (왜 이게 작동하는가)

이 하네스는 LLM 에이전트의 3가지 고질병을 구조적으로 차단한다.

| 고질병 | 차단 장치 |
|--------|-----------|
| **명령 오해** — 엉뚱한 걸 만든다 | **명령 수신 확인 게이트** + **원본 지시 검증** (작업 전/후 양쪽에서 사용자 원문과 대조) |
| **얕은 검증** — "화면 떴으니 됨" 하고 끝낸다 | **테스터 4대 강제장치** (테스트 플랜 파일 / STATUS BLOCK / 인터랙션 카운터 / 체크리스트 스캔). 실제로 클릭·입력하지 않으면 자동 실격 |
| **같은 실수 반복** — 매번 같은 버그 | **교훈 루프** (`active-lessons.md` → 모든 에이전트 시작 시 자동 주입 → 반복되면 헌법으로 영구 승격) |

여기에 더해 **6개 역할**(팀장·기획자·구현자·검토자·테스터·반영자)과 **단계별 슬래시 명령**으로
"기획 → 구현 → 검토 → 테스트 → 배포 → 반영" 전 사이클을 자동화한다.

---

## 폴더 구조

```
harness-template/
├── README.md                       ← 지금 이 파일 (이식 가이드)
├── SETUP.md                        ← 플레이스홀더 전체 목록 + 채우는 법
├── AGENTS.md                       ← 에이전트 헌법 (최상위 규범) ★ 가장 중요
├── CLAUDE.md                       ← 트리거 키워드 + 빌드/배포/테스트 명령 사전
├── ARCHITECTURE.template.md        ← 아키텍처 개요 (프로젝트별로 채움)
├── .claude/commands/               ← 슬래시 명령 정의
│   ├── auto.md     (완전 자율 루프)
│   ├── plan.md     (실행 계획 작성)
│   ├── implement.md(구현)
│   ├── review.md   (품질 검토)
│   ├── test.md     (로컬 테스트)
│   ├── tcp.md      (빌드→테스트→커밋→푸시→배포)
│   ├── reflect.md  (교훈 추출)
│   ├── read.md     (컨텍스트 로딩)
│   └── main-apply.md(프로덕션 반영)
├── docs/
│   ├── agent-roles/                ← 역할별 상세 행동 규칙 (6개)
│   ├── QUALITY_SCORE.md            ← 품질 평가 체크리스트 A~G
│   ├── SECURITY.template.md        ← 보안 규칙 (프로젝트별로 채움)
│   ├── RELIABILITY.template.md     ← 배포 안정성 (프로젝트별로 채움)
│   ├── references/                 ← 교훈 아카이브 (lessons / active-lessons / skill-evolution)
│   ├── exec-plans/                 ← 실행 계획 라이프사이클 + 템플릿
│   ├── metrics/harness-health.md   ← 하네스 건강 지표 (Append-only)
│   └── test-plans/_template.md     ← 테스트 플랜 템플릿
└── scripts/
    ├── install-hooks.sh            ← git 훅 연결 (1회 실행)
    └── hooks/                      ← post-commit / pre-push / pre-merge-commit
```

---

## 새 프로젝트에 이식하는 법 (3단계)

### 1단계 — 파일 복사

대상 프로젝트 루트에서:

```bash
# 이 템플릿 폴더 안의 내용물을 프로젝트 루트로 복사
cp harness-template/AGENTS.md            ./AGENTS.md
cp harness-template/CLAUDE.md            ./CLAUDE.md
cp harness-template/ARCHITECTURE.template.md ./ARCHITECTURE.md
cp -r harness-template/.claude/commands  ./.claude/
cp -r harness-template/docs/agent-roles  ./docs/
cp harness-template/docs/QUALITY_SCORE.md ./docs/
cp harness-template/docs/SECURITY.template.md    ./docs/SECURITY.md
cp harness-template/docs/RELIABILITY.template.md  ./docs/RELIABILITY.md
cp -r harness-template/docs/references    ./docs/
cp -r harness-template/docs/exec-plans    ./docs/
cp -r harness-template/docs/metrics       ./docs/
cp -r harness-template/docs/test-plans    ./docs/
cp -r harness-template/scripts/hooks      ./scripts/
cp harness-template/scripts/install-hooks.sh ./scripts/
```

> CLAUDE.md가 이미 있으면 덮어쓰지 말고 이 템플릿 내용을 **병합**한다.

### 2단계 — 플레이스홀더 채우기

`{{...}}` 형태의 빈칸을 프로젝트 값으로 치환한다. 전체 목록은 [`SETUP.md`](./SETUP.md) 참조.
최소한 아래는 꼭 채워야 한다:

| 플레이스홀더 | 의미 | 예시 |
|--------------|------|------|
| `{{PROJECT_NAME}}` | 프로젝트 이름 | `my-app` |
| `{{PROJECT_SLUG}}` | sentinel/락 파일 접두어 | `myapp` |
| `{{BUILD_CMD}}` | 빌드 명령 | `npm run build` |
| `{{DEPLOY_DEV_CMD}}` | dev 배포 명령 | `npm run deploy:dev` |
| `{{DEV_URL}}` | dev 환경 URL | `https://dev.myapp.com` |
| `{{PROD_URL}}` | 프로덕션 URL | `https://myapp.com` |
| `{{TEST_ACCOUNT}}` | 테스트 계정 | `test@myapp.local / Pw1234!` |

> 가장 빠른 방법: 에이전트에게 "harness 플레이스홀더를 이 프로젝트에 맞게 채워줘"라고 시키고
> SETUP.md를 참조하게 한다.

### 3단계 — git 훅 연결 (선택)

브랜치 보호(main 직접 푸시 차단)·커밋 후 자동 배포를 쓰려면:

```bash
bash scripts/install-hooks.sh
```

훅이 필요 없으면 이 단계는 건너뛴다 (하네스의 나머지는 훅 없이도 완전 동작).

---

## 최소 도입 vs 전체 도입

처음부터 전부 쓸 필요는 없다. 가치 순서로 단계 도입을 권장한다.

**Tier 1 (필수 — 이것만으로도 큰 효과)**
- `AGENTS.md` — 헌법 + 명령 수신 확인 + 원본 지시 검증 프로토콜
- `docs/references/active-lessons.md` — 교훈 루프

**Tier 2 (개발 사이클 자동화)**
- `.claude/commands/{plan,implement,review,tcp}.md`
- `docs/agent-roles/*` + `docs/QUALITY_SCORE.md`
- `docs/exec-plans/` + 테스트 플랜 게이트

**Tier 3 (완전 자율 + 측정)**
- `.claude/commands/auto.md` — 무개입 자율 루프
- `docs/metrics/harness-health.md` — 정량 지표
- `scripts/hooks/` — 브랜치 보호 + 자동 배포

---

## 설계 철학 (이식 시 유지할 것)

1. **단일 원천 (Single Source of Truth)** — 규칙은 한 곳에만 정의하고 나머지는 링크. 충돌 시 우선순위 표로 해결.
2. **게이트는 우회 불가** — 명령 수신 확인·테스트 플랜·원본 지시 검증은 "건너뛰면 자동 실패".
3. **실수는 즉시 기록, 반복되면 규칙으로 승격** — 사람이 같은 지적을 두 번 하지 않게.
4. **검증은 직접 실행** — "보고 끝"이 아니라 클릭·입력·CRUD를 실제로 수행하고 카운트.
5. **완결성 우선** — 너트를 만들면 볼트도 만든다 (진입→실행→결과확인→복귀→에러안내 전부).

---

## 출처

이 템플릿은 Next.js + Cloudflare Workers 기반 마케팅 SaaS에서 수개월간 운영하며
실패·교훈으로 다듬어진 하네스를 일반화한 것이다. 프로젝트 고유 내용(특정 API·런타임 제약·
결제·도메인 지식)은 모두 제거하고 **방법론·역할·프로토콜·명령 골격**만 남겼다.
