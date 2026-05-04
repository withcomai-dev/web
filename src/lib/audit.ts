"use client";

import { auth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AuditAction = "create" | "update" | "delete";

export interface AuditEntry {
  id?: string;
  actorUid?: string;
  actorEmail?: string;
  action: AuditAction;
  collection: string;
  docId: string;
  before?: unknown;
  after?: unknown;
  createdAt?: string;
}

const SKIP_COLLECTIONS = new Set([
  "auditLogs",
  "aiUsageLogs",
  "feedbackReports",
]);

/**
 * Firestore CRUD 헬퍼들이 호출 후 사용하도록 만든 후크.
 * 실패는 silent (메인 작업을 막지 않음).
 */
export async function recordAudit(entry: Omit<AuditEntry, "actorUid" | "actorEmail" | "createdAt">) {
  if (SKIP_COLLECTIONS.has(entry.collection)) return;
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, "auditLogs"), {
      actorUid: user?.uid ?? null,
      actorEmail: user?.email ?? null,
      action: entry.action,
      collection: entry.collection,
      docId: entry.docId,
      before: entry.before ?? null,
      after: entry.after ?? null,
      createdAt: serverTimestamp(),
    });
  } catch {
    // ignore
  }
}
