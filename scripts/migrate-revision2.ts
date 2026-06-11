/**
 * 2차 요청사항(2026-06-11) 라이브 Firestore 데이터 마이그레이션
 *
 * 수행 내용 (siteSettings 컬렉션 — integrations 문서 제외):
 *   1. 전 문서 JSON 백업 (scripts/backups/siteSettings-{ts}.json)
 *   2. 문자열 치환: "주식회사 위드컴정보"/"(주)위드컴정보"/"위드컴정보" → "WITHCOM AI"
 *   3. page_smartwork-ai: AI TOOL 소개 카드 6개에 게시판 링크(href) 부여
 *   4. page_home: services 섹션을 4카드(쇼핑몰·블로그·원격지원·유튜브)로 교체
 *   5. contact 섹션: email=withcomai@gmail.com, phone·address 제거,
 *      contact 페이지(page_contact)만 showList=true
 *
 * 실행:
 *   npx tsx scripts/migrate-revision2.ts --dry     # 변경 미리보기 (쓰기 없음)
 *   npx tsx scripts/migrate-revision2.ts           # 실제 반영
 *   npx tsx scripts/migrate-revision2.ts --restore=scripts/backups/siteSettings-xxx.json
 *
 * 멱등: 재실행해도 결과 동일 (변경 없는 문서는 건너뜀)
 */

import { config } from "dotenv";
import { resolve } from "path";
import { mkdirSync, readFileSync, writeFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { homedir, tmpdir } from "os";
import { existsSync } from "fs";
import { ALL_PAGE_SEEDS } from "../src/lib/seed-data";
import { AI_TOOL_CATEGORIES } from "../src/lib/constants";
import type { Section } from "../src/types/cms";

const DRY = process.argv.includes("--dry");
const RESTORE = process.argv.find((a) => a.startsWith("--restore="))?.slice(10);

/** 치환 규칙 — 긴 패턴 먼저 */
const REPLACEMENTS: [string, string][] = [
  ["주식회사 위드컴정보", "WITHCOM AI"],
  ["(주)위드컴정보", "WITHCOM AI"],
  ["위드컴정보", "WITHCOM AI"],
];

const NEW_EMAIL = "withcomai@gmail.com";

// firebase CLI(firebase-tools)의 공개 OAuth 클라이언트 — CLI 소스에 공개된 상수
const FIREBASE_CLI_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLI_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

function ensureApp() {
  if (getApps().length > 0) return;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(".env.local 의 NEXT_PUBLIC_FIREBASE_PROJECT_ID 가 필요합니다.");
  }

  // 1순위: 명시적 서비스계정 (.env.local)
  const clientEmail = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  if (clientEmail && privateKey) {
    const sa: ServiceAccount = { projectId, clientEmail, privateKey };
    initializeApp({ credential: cert(sa) });
    return;
  }

  // 2순위: firebase CLI 로그인 refresh token (이 프로젝트의 문서화된 인증 패턴)
  // Firestore Admin 클라이언트는 cert/ADC만 허용하므로, refresh token을
  // authorized_user ADC 임시 파일로 변환해 GOOGLE_APPLICATION_CREDENTIALS 로 주입한다.
  const configPath = resolve(homedir(), ".config/configstore/firebase-tools.json");
  if (existsSync(configPath)) {
    const cfg = JSON.parse(readFileSync(configPath, "utf-8")) as {
      tokens?: { refresh_token?: string };
    };
    const rt = cfg.tokens?.refresh_token;
    if (rt) {
      const adc = {
        type: "authorized_user",
        client_id: FIREBASE_CLI_CLIENT_ID,
        client_secret: FIREBASE_CLI_CLIENT_SECRET,
        refresh_token: rt,
        quota_project_id: projectId,
      };
      const adcPath = resolve(tmpdir(), `withcom-migrate-adc-${process.pid}.json`);
      writeFileSync(adcPath, JSON.stringify(adc), { mode: 0o600 });
      process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath;
      process.on("exit", () => {
        try {
          // 임시 자격증명 파일 정리
          require("fs").unlinkSync(adcPath);
        } catch {
          // 이미 삭제됐으면 무시
        }
      });
      initializeApp({ projectId });
      console.log("(인증: firebase CLI refresh token → 임시 ADC 사용)\n");
      return;
    }
  }

  throw new Error(
    "인증 수단이 없습니다 — .env.local 서비스계정 또는 firebase login 이 필요합니다.",
  );
}

/** 객체/배열 내 모든 문자열에 치환 규칙 적용 (깊은 순회) */
function deepReplace<T>(value: T): T {
  if (typeof value === "string") {
    let out: string = value;
    for (const [from, to] of REPLACEMENTS) out = out.split(from).join(to);
    return out as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepReplace(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepReplace(v);
    }
    return out as unknown as T;
  }
  return value;
}

type AnyDoc = Record<string, unknown>;

/** 섹션 구조 업데이트 (페이지 문서에만 적용) */
function applyStructural(docId: string, doc: AnyDoc): AnyDoc {
  if (!Array.isArray(doc.sections)) return doc;
  const seedHome = ALL_PAGE_SEEDS.find((p) => p.key === "home");
  const seedServicesItems = (
    seedHome?.sections.find((s) => s.type === "services")?.data as
      | { items?: unknown[] }
      | undefined
  )?.items;

  const sections = (doc.sections as Section[]).map((section) => {
    const s = { ...section, data: { ...(section.data as AnyDoc) } } as Section & {
      data: AnyDoc;
    };

    // 4) 홈 services 섹션 → 4카드(쇼핑몰·블로그·원격지원·유튜브)로 교체
    if (docId === "page_home" && s.type === "services" && seedServicesItems) {
      s.data.items = seedServicesItems;
    }

    // 3) AI TOOL 소개 카드에 게시판 링크 부여 (제목 매칭, 페이지 무관)
    if (s.type === "cards" && Array.isArray(s.data.items)) {
      s.data.items = (s.data.items as AnyDoc[]).map((item) => {
        const match = AI_TOOL_CATEGORIES.find((c) => c.label === item.title);
        return match ? { ...item, href: `/ai-tools?cat=${match.slug}` } : item;
      });
    }

    // 5) contact 섹션: 이메일 교체 + 전화/주소 제거 + contact 페이지만 문의 리스트 노출
    if (s.type === "contact") {
      s.data.email = NEW_EMAIL;
      delete s.data.phone;
      delete s.data.address;
      if (docId === "page_contact") s.data.showList = true;
    }

    return s;
  });

  return { ...doc, sections };
}

async function main() {
  ensureApp();
  const db = getFirestore();
  const col = db.collection("siteSettings");

  // ── 복원 모드 ──
  if (RESTORE) {
    const backup = JSON.parse(readFileSync(RESTORE, "utf-8")) as Record<
      string,
      AnyDoc
    >;
    for (const [id, data] of Object.entries(backup)) {
      if (DRY) {
        console.log(`[dry] 복원 예정: siteSettings/${id}`);
        continue;
      }
      await col.doc(id).set(data);
      console.log(`복원 완료: siteSettings/${id}`);
    }
    console.log(`\n복원 ${DRY ? "미리보기" : "완료"} — ${Object.keys(backup).length}개 문서`);
    return;
  }

  // ── 1) 백업 (integrations 제외 — 시크릿은 로컬 파일로 내리지 않는다) ──
  const snap = await col.get();
  const docs = snap.docs.filter((d) => d.id !== "integrations");
  const backupObj: Record<string, AnyDoc> = {};
  for (const d of docs) backupObj[d.id] = d.data();

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = resolve(process.cwd(), "scripts/backups");
  mkdirSync(backupDir, { recursive: true });
  const backupPath = resolve(backupDir, `siteSettings-${ts}.json`);
  writeFileSync(backupPath, JSON.stringify(backupObj, null, 2), "utf-8");
  console.log(`백업 저장: ${backupPath} (${docs.length}개 문서, integrations 제외)\n`);

  // ── 2~5) 치환 + 구조 업데이트 ──
  let changed = 0;
  for (const d of docs) {
    const before = d.data() as AnyDoc;
    let after = deepReplace(before);
    after = applyStructural(d.id, after);

    if (JSON.stringify(before) === JSON.stringify(after)) {
      console.log(`변경 없음: ${d.id}`);
      continue;
    }
    changed++;
    if (DRY) {
      console.log(`[dry] 변경 예정: ${d.id}`);
      continue;
    }
    await col.doc(d.id).set(after);
    console.log(`반영 완료: ${d.id}`);
  }

  console.log(
    `\n마이그레이션 ${DRY ? "미리보기" : "완료"} — 변경 ${changed}개 / 전체 ${docs.length}개`,
  );
  if (!DRY && changed > 0) {
    console.log(`롤백: npx tsx scripts/migrate-revision2.ts --restore=${backupPath}`);
  }
}

main().catch((e) => {
  console.error("마이그레이션 실패:", e);
  process.exit(1);
});
