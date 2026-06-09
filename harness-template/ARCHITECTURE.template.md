# ARCHITECTURE.md — 시스템 아키텍처 개요

> 빠른 아키텍처 파악용 문서. 프로젝트별로 채운다. 상세는 분리 파일로 lazy load.

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | {{FRAMEWORK}} | |
| 언어 | {{LANGUAGE}} | 느슨한 타입 금지 |
| 스타일링 | {{STYLING}} | |
| 런타임 | {{RUNTIME}} | {{RUNTIME_CONSTRAINTS}} |
| DB | {{DB}} | |
| 인증 | {{AUTH}} | |
| 패키지 | npm | |

---

## 핵심 데이터 흐름

```
{프로젝트의 주요 데이터 흐름을 ASCII 다이어그램으로 — 입력 → 처리 → 출력}
```

---

## 디렉토리 구조 (핵심만)

```
src/
├── app/          {라우트 / 페이지}
├── lib/          {비즈니스 로직 — 서비스 클래스}
├── components/   {공유 UI}
├── types/        {타입 정의}
└── ...
```

---

## 핵심 아키텍처 패턴

1. **{패턴명}** — {설명}
2. ...

---

## 관련 문서

- `docs/SECURITY.md` — 보안 규칙
- `docs/RELIABILITY.md` — 배포 안정성, 롤백
- `docs/QUALITY_SCORE.md` — 품질 평가
