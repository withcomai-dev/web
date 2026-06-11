// aiTools 데이터 정정 (1회성): 잘못 입력된 슬러그(URL)·미래 발행일·썸네일(웹주소) 정리
// 실행: npx tsx scripts/fix-aitools-data.ts
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { homedir, tmpdir } from "os";
import { readFileSync, writeFileSync } from "fs";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const cfg = JSON.parse(
  readFileSync(resolve(homedir(), ".config/configstore/firebase-tools.json"), "utf-8"),
);
const adc = {
  type: "authorized_user",
  client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
  client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
  refresh_token: cfg.tokens.refresh_token,
  quota_project_id: projectId,
};
const p = resolve(tmpdir(), `adc-${process.pid}.json`);
writeFileSync(p, JSON.stringify(adc), { mode: 0o600 });
process.env.GOOGLE_APPLICATION_CREDENTIALS = p;
initializeApp({ projectId });

(async () => {
  const db = getFirestore();
  const snap = await db.collection("aiTools").get();
  for (const d of snap.docs) {
    const v = d.data();
    const patch: Record<string, unknown> = {};
    // 슬러그에 URL이 들어간 경우 → 정상 슬러그로 교체
    if (typeof v.slug === "string" && /^https?:\/\//.test(v.slug)) {
      patch.slug = `tool-${d.id.slice(0, 8).toLowerCase()}`;
    }
    // 발행일이 미래인 경우 → 현재 시각으로 정정
    if (typeof v.publishedAt === "string" && v.publishedAt > new Date().toISOString()) {
      patch.publishedAt = new Date().toISOString();
    }
    // 썸네일에 이미지가 아닌 웹페이지 주소가 들어간 경우 → 제거 (placeholder 노출)
    if (
      typeof v.thumbnail === "string" &&
      v.thumbnail &&
      !/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(v.thumbnail) &&
      !v.thumbnail.includes("firebasestorage") &&
      !v.thumbnail.includes("googleusercontent")
    ) {
      patch.thumbnail = "";
    }
    if (Object.keys(patch).length > 0) {
      await d.ref.update(patch);
      console.log(`정정: ${v.title} →`, JSON.stringify(patch));
    } else {
      console.log(`정상: ${v.title}`);
    }
  }
})();
