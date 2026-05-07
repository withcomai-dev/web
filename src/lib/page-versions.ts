"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  limit as fbLimit,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth, isFirebaseConfigured } from "@/lib/firebase";
import { COLLECTIONS, PAGE_DOC_ID, setSingletonDoc } from "@/lib/firestore";
import type { PageDoc } from "@/types/cms";

const MAX_VERSIONS = 20;

export interface PageVersion {
  id: string;
  sections: PageDoc["sections"];
  title?: string;
  savedBy?: string;
  savedAt?: { toDate(): Date } | string;
}

/**
 * 현재 페이지를 버전으로 스냅샷한다 (저장 직전에 호출).
 */
export async function snapshotPageVersion(page: PageDoc): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const versionsRef = collection(
      doc(db, COLLECTIONS.SETTINGS, PAGE_DOC_ID(page.key)),
      "versions",
    );
    await addDoc(versionsRef, {
      sections: page.sections,
      title: page.title,
      savedBy: auth.currentUser?.email ?? "unknown",
      savedAt: serverTimestamp(),
    });
  } catch {
    // ignore
  }
}

/**
 * 최근 버전 목록을 가져온다 (최신순).
 */
export async function listPageVersions(key: string): Promise<PageVersion[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(
      collection(doc(db, COLLECTIONS.SETTINGS, PAGE_DOC_ID(key)), "versions"),
      orderBy("savedAt", "desc"),
      fbLimit(MAX_VERSIONS),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PageVersion));
  } catch {
    return [];
  }
}

/**
 * 선택한 버전의 sections를 페이지로 복원한다.
 */
export async function restorePageVersion(
  key: string,
  version: PageVersion,
): Promise<void> {
  await setSingletonDoc(COLLECTIONS.SETTINGS, PAGE_DOC_ID(key), {
    key,
    title: version.title ?? key,
    sections: version.sections,
  });
}
