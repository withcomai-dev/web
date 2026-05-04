import { getApps, initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";

let _adminDb: Firestore | null = null;

function ensureApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin 환경변수가 설정되지 않았습니다. (PROJECT_ID, SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY)",
    );
  }

  const serviceAccount: ServiceAccount = { projectId, clientEmail, privateKey };
  return initializeApp({ credential: cert(serviceAccount) });
}

export function adminDb(): Firestore {
  if (_adminDb) return _adminDb;
  _adminDb = getFirestore(ensureApp());
  return _adminDb;
}

export { FieldValue };
