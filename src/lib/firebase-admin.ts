import { getApps, initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let _adminDb: Firestore | null = null;

function ensureApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  // 1) 명시적 서비스계정 자격증명이 있으면 사용 (로컬 개발·Google Sheets 연동 등).
  if (projectId && clientEmail && privateKey) {
    const serviceAccount: ServiceAccount = { projectId, clientEmail, privateKey };
    return initializeApp({ credential: cert(serviceAccount) });
  }

  // 2) 없으면 런타임 기본 자격증명(ADC)으로 초기화.
  //    App Hosting/Cloud Run 에선 백엔드 서비스계정으로 Firestore 접근이 되므로
  //    별도 서비스계정 시크릿 없이도 동작한다. (문의·런모아 회원 기록 등)
  return initializeApp(projectId ? { projectId } : undefined);
}

export function adminDb(): Firestore {
  if (_adminDb) return _adminDb;
  _adminDb = getFirestore(ensureApp());
  // undefined 필드를 무시(에러 대신). 문의 등에서 빈 값이 undefined 로 들어와도
  // "Cannot use undefined as a Firestore value" 로 쓰기가 실패하지 않게 한다.
  try {
    _adminDb.settings({ ignoreUndefinedProperties: true });
  } catch {
    // 이미 settings 가 적용된 경우 등은 무시
  }
  return _adminDb;
}

/** Firebase Admin Auth (런모아 로그인용 커스텀 토큰 발급 등). */
export function adminAuth(): Auth {
  return getAuth(ensureApp());
}

export { FieldValue };
