import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  Auth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Firebase가 실제 키로 설정되어 있는지 판단.
 * dummy/빈값이면 false → Firestore·Storage 호출을 단락(short-circuit)해
 * timeout 대기를 피하고 즉시 빈 결과로 폴백한다.
 */
export function isFirebaseConfigured(): boolean {
  const k = firebaseConfig.apiKey ?? "";
  const p = firebaseConfig.projectId ?? "";
  if (!k || !p) return false;
  if (k.toLowerCase() === "dummy" || p.toLowerCase() === "dummy") return false;
  // Firebase API 키는 보통 "AIza"로 시작하는 39자 — 그렇지 않으면 의심
  if (k.length < 20) return false;
  return true;
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function ensureApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return _app;
}

export function getFirebaseApp(): FirebaseApp {
  return ensureApp();
}

export const auth: Auth = (() => {
  if (typeof window === "undefined") {
    return getAuth(ensureApp());
  }
  if (_auth) return _auth;
  _auth = getAuth(ensureApp());
  setPersistence(_auth, browserLocalPersistence).catch(() => {});
  return _auth;
})();

export const db: Firestore = (() => {
  if (_db) return _db;
  if (typeof window === "undefined") {
    // 서버/빌드 환경: gRPC/WebChannel 이 막힌 네트워크에서도 읽을 수 있도록
    // HTTPS long-polling 강제 (정적 export 빌드 시 Firestore 데이터 수집용)
    _db = initializeFirestore(ensureApp(), {
      experimentalForceLongPolling: true,
    });
  } else {
    _db = initializeFirestore(ensureApp(), {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  }
  return _db;
})();

export const storage: FirebaseStorage = (() => {
  if (_storage) return _storage;
  _storage = getStorage(ensureApp());
  return _storage;
})();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
