/**
 * 초기 시드 스크립트
 * - 페이지 6종 (siteSettings/page_*) 시드
 * - 도움말 글 4종 시드
 * - 콘텐츠 샘플 5종 시드
 *
 * 실행:
 *   1. .env.local 에 Firebase Admin 환경변수 설정
 *      (NEXT_PUBLIC_FIREBASE_PROJECT_ID, GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
 *       GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY)
 *   2. npm run seed
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { ALL_PAGE_SEEDS } from "../src/lib/seed-data";

function ensureApp() {
  if (getApps().length > 0) return;
  const sa: ServiceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n",
    ),
  };
  if (!sa.projectId || !sa.clientEmail || !sa.privateKey) {
    throw new Error(
      ".env.local 의 NEXT_PUBLIC_FIREBASE_PROJECT_ID, GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL, GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY 가 필요합니다.",
    );
  }
  initializeApp({ credential: cert(sa) });
}

async function seedPages(db: FirebaseFirestore.Firestore) {
  console.log("📄 페이지 시드 시작...");
  for (const page of ALL_PAGE_SEEDS) {
    const id = `page_${page.key}`;
    const existing = await db.collection("siteSettings").doc(id).get();
    if (existing.exists) {
      console.log(`  - ${id}: 이미 존재 (스킵)`);
      continue;
    }
    await db.collection("siteSettings").doc(id).set({
      ...page,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`  + ${id}: 생성됨`);
  }
}

async function seedHelpDocs(db: FirebaseFirestore.Firestore) {
  console.log("🆘 도움말 시드 시작...");
  const docs = [
    {
      category: "사이트 이용",
      title: "위드컴정보 사이트 사용 안내",
      slug: "site-usage",
      bodyHtml:
        "<p>위드컴정보 사이트의 주요 기능과 사용법을 안내합니다.</p><ul><li>홈에서 회사 소개 확인</li><li>콘텐츠 메뉴에서 IT/AI 정보 열람</li><li>쇼핑몰에서 상품 구매</li><li>문의하기에서 상담 신청</li></ul>",
      audience: "public",
      order: 1,
      status: "published",
    },
    {
      category: "회원·로그인",
      title: "Google 로그인 방법",
      slug: "google-login",
      bodyHtml:
        "<p>위드컴정보는 Google 계정으로 로그인합니다.</p><ol><li>우상단 또는 푸터의 [로그인] 클릭</li><li>Google 계정 선택</li><li>최초 로그인 시 자동 가입됩니다.</li></ol>",
      audience: "public",
      order: 2,
      status: "published",
    },
    {
      category: "쇼핑몰",
      title: "상품 구매·결제 안내",
      slug: "shop-checkout",
      bodyHtml:
        "<p>쇼핑몰 상품의 구매·결제는 런모아 플랫폼을 통해 진행됩니다.</p><ul><li>상품 상세에서 [구매하기] 클릭</li><li>새 창으로 런모아 결제 페이지가 열립니다.</li><li>결제·배송 문의는 런모아 안내에 따릅니다.</li></ul>",
      audience: "public",
      order: 3,
      status: "published",
    },
    {
      category: "사이트 이용",
      title: "(관리자) 페이지·섹션 편집 방법",
      slug: "admin-pages",
      bodyHtml:
        "<p>관리자 모드 → [페이지·섹션] 메뉴에서 모든 공개 페이지를 편집할 수 있습니다.</p><ol><li>편집할 페이지 탭 선택</li><li>섹션을 클릭해 편집 패널 열기</li><li>위/아래 화살표로 순서 변경, 토글로 노출 제어</li><li>[저장] 클릭</li></ol>",
      audience: "admin",
      order: 10,
      status: "published",
    },
  ];

  for (const d of docs) {
    const existing = await db
      .collection("helpDocs")
      .where("slug", "==", d.slug)
      .limit(1)
      .get();
    if (!existing.empty) {
      console.log(`  - ${d.slug}: 이미 존재 (스킵)`);
      continue;
    }
    await db.collection("helpDocs").add({
      ...d,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`  + ${d.slug}: 생성됨`);
  }
}

async function seedContents(db: FirebaseFirestore.Firestore) {
  console.log("📝 콘텐츠 샘플 시드 시작...");
  const samples = [
    {
      title: "생성형 AI로 보고서 작성 시간 50% 단축하기",
      slug: "ai-report-tips",
      category: "AI 활용 팁",
      thumbnail:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
      summary:
        "실무에서 바로 활용 가능한 구체적인 방법론과 사례를 통해 디지털 전환의 해답을 제시합니다.",
      bodyHtml:
        "<p>ChatGPT, Claude, Gemini 등 생성형 AI를 활용하여 보고서 작성 시간을 절반으로 줄이는 5가지 방법을 소개합니다.</p>",
      status: "published",
    },
    {
      title: "중소기업을 위한 협업 도구 도입 성공 사례",
      slug: "collab-tools-case",
      category: "스마트워크",
      thumbnail:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
      summary:
        "30인 규모 중소기업이 스마트워크 도구를 도입한 후 업무 효율이 어떻게 변했는지 소개합니다.",
      bodyHtml:
        "<p>Slack, Notion, Google Workspace를 통합 도입한 사례를 분석합니다.</p>",
      status: "published",
    },
    {
      title: "2026년 디지털 전환(DX) 핵심 전략 가이드",
      slug: "dx-strategy-2026",
      category: "IT 트렌드",
      thumbnail:
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
      summary:
        "올해 중소기업이 주목해야 할 디지털 전환 5대 키워드를 정리했습니다.",
      bodyHtml:
        "<p>AI 자동화, 클라우드 마이그레이션, 보안, 데이터 분석, 직원 디지털 역량 강화 5가지를 다룹니다.</p>",
      status: "published",
    },
    {
      title: "Google Workspace 도입 단계별 체크리스트",
      slug: "google-workspace-checklist",
      category: "스마트워크",
      thumbnail:
        "https://images.unsplash.com/photo-1611224885990-ab7363d7f2ee?auto=format&fit=crop&q=80&w=800",
      summary:
        "Google Workspace를 처음 도입하는 기업을 위한 단계별 가이드.",
      bodyHtml:
        "<p>도메인 연결부터 사용자 추가, 보안 설정까지 전체 흐름을 안내합니다.</p>",
      status: "published",
    },
    {
      title: "원격지원, 이렇게 활용하면 업무 중단 0초",
      slug: "remote-support-guide",
      category: "IT 서비스",
      thumbnail:
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800",
      summary: "전문 엔지니어 원격지원 서비스를 효과적으로 활용하는 팁.",
      bodyHtml:
        "<p>원격지원 요청 전 체크해야 할 사항과 빠른 해결을 위한 협업 노하우를 소개합니다.</p>",
      status: "published",
    },
  ];

  for (const c of samples) {
    const existing = await db
      .collection("contents")
      .where("slug", "==", c.slug)
      .limit(1)
      .get();
    if (!existing.empty) {
      console.log(`  - ${c.slug}: 이미 존재 (스킵)`);
      continue;
    }
    await db.collection("contents").add({
      ...c,
      publishedAt: new Date().toISOString(),
      viewCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`  + ${c.slug}: 생성됨`);
  }
}

async function main() {
  ensureApp();
  const db = getFirestore();
  await seedPages(db);
  await seedHelpDocs(db);
  await seedContents(db);
  console.log("✅ 시드 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
