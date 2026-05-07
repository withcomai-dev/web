import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit as fbLimit,
  serverTimestamp,
  DocumentData,
  WithFieldValue,
  QueryConstraint,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { recordAudit } from "./audit";

const CACHE_TTL = 30_000;
const _cache = new Map<string, { data: unknown[]; ts: number }>();
const _singletonCache = new Map<string, { data: unknown; ts: number }>();

export function invalidateCache(col: string) {
  for (const key of _cache.keys()) {
    if (key === col || key.startsWith(`${col}__`)) _cache.delete(key);
  }
  for (const key of _singletonCache.keys()) {
    if (key.startsWith(`${col}/`)) _singletonCache.delete(key);
  }
}

function logSafeFail(op: string, e: unknown): void {
  if (typeof console !== "undefined") {
    console.warn(`[firestore] ${op} 실패 (오프라인 또는 미설정):`, e);
  }
}

/**
 * Firebase 미설정 시 즉시 단락(short-circuit)해 SDK timeout 대기를 피한다.
 */
function shortCircuit<T>(empty: T): T | null {
  if (!isFirebaseConfigured()) return empty;
  return null;
}

export async function getCollection<T>(col: string): Promise<T[]> {
  const cached = _cache.get(col);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data as T[];
  const sc = shortCircuit<T[]>([]);
  if (sc !== null) return sc;
  try {
    const snap = await getDocs(collection(db, col));
    const result = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    _cache.set(col, { data: result, ts: Date.now() });
    return result;
  } catch (e) {
    logSafeFail(`getCollection(${col})`, e);
    return [];
  }
}

export async function getOrderedCollection<T>(
  col: string,
  field: string,
  dir: "asc" | "desc" = "asc",
): Promise<T[]> {
  const cacheKey = `${col}__${field}__${dir}`;
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data as T[];
  const sc = shortCircuit<T[]>([]);
  if (sc !== null) return sc;
  try {
    const q = query(collection(db, col), orderBy(field, dir));
    const snap = await getDocs(q);
    const result = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    _cache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch (e) {
    logSafeFail(`getOrderedCollection(${col})`, e);
    return [];
  }
}

export async function getQueriedCollection<T>(
  col: string,
  constraints: QueryConstraint[],
): Promise<T[]> {
  const sc = shortCircuit<T[]>([]);
  if (sc !== null) return sc;
  try {
    const q = query(collection(db, col), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
  } catch (e) {
    logSafeFail(`getQueriedCollection(${col})`, e);
    return [];
  }
}

export async function createDoc<T extends DocumentData>(
  col: string,
  data: WithFieldValue<T>,
): Promise<string> {
  const ref = await addDoc(collection(db, col), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  invalidateCache(col);
  void recordAudit({ action: "create", collection: col, docId: ref.id, after: data });
  return ref.id;
}

export async function upsertDoc<T extends DocumentData>(
  col: string,
  id: string,
  data: WithFieldValue<T>,
): Promise<void> {
  await setDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  invalidateCache(col);
  void recordAudit({ action: "update", collection: col, docId: id, after: data });
}

export async function updateDocFields<T extends DocumentData>(
  col: string,
  id: string,
  data: Partial<T>,
): Promise<void> {
  await updateDoc(doc(db, col, id), {
    ...data,
    updatedAt: serverTimestamp(),
  } as DocumentData);
  invalidateCache(col);
  void recordAudit({ action: "update", collection: col, docId: id, after: data });
}

export async function removeDoc(col: string, id: string): Promise<void> {
  await deleteDoc(doc(db, col, id));
  invalidateCache(col);
  void recordAudit({ action: "delete", collection: col, docId: id });
}

export async function getDocById<T>(col: string, id: string): Promise<T | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const snap = await getDoc(doc(db, col, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as T;
  } catch (e) {
    logSafeFail(`getDocById(${col}/${id})`, e);
    return null;
  }
}

export async function getSingletonDoc<T>(col: string, id: string): Promise<T | null> {
  const cacheKey = `${col}/${id}`;
  const cached = _singletonCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data as T | null;
  const result = await getDocById<T>(col, id);
  _singletonCache.set(cacheKey, { data: result, ts: Date.now() });
  return result;
}

export async function setSingletonDoc<T extends DocumentData>(
  col: string,
  id: string,
  data: WithFieldValue<T>,
): Promise<void> {
  await setDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() });
  invalidateCache(col);
  void recordAudit({ action: "update", collection: col, docId: id, after: data });
}

export const COLLECTIONS = {
  USERS: "users",
  SETTINGS: "siteSettings",
  CONTENTS: "contents",
  SME_SUPPORT: "smeSupport",
  HELP_DOCS: "helpDocs",
  HELP_QUESTIONS: "helpQuestions",
  BANNERS: "banners",
  INQUIRIES: "inquiries",
  FEEDBACK_REPORTS: "feedbackReports",
} as const;

export const PAGE_DOC_ID = (key: string) => `page_${key}`;
export const GLOBAL_SETTINGS_DOC_ID = "global";

export { where, orderBy, fbLimit as limit };
