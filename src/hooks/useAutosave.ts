"use client";

import { useEffect, useRef } from "react";

const PREFIX = "withcom.autosave.v1.";

export interface AutosaveAPI {
  /** Reads any saved draft for this key (called once on mount) */
  read: <T>() => T | null;
  /** Manually clears (e.g., after successful real save) */
  clear: () => void;
}

/**
 * Persists `data` to localStorage every `intervalMs` (debounced) — survives reload.
 *
 * Usage:
 *   const autosave = useAutosave("contents-edit-${id}", form);
 *   useEffect(() => {
 *     const draft = autosave.read<FormShape>();
 *     if (draft && confirm("이전 작성중 내용이 있습니다. 복구할까요?")) setForm(draft);
 *   }, []);
 */
export function useAutosave<T>(
  key: string,
  data: T,
  intervalMs = 10_000,
): AutosaveAPI {
  const dataRef = useRef(data);
  dataRef.current = data;
  const fullKey = PREFIX + key;

  useEffect(() => {
    const t = setInterval(() => {
      try {
        localStorage.setItem(
          fullKey,
          JSON.stringify({ ts: Date.now(), data: dataRef.current }),
        );
      } catch {
        // quota or serialization failure — silently ignore
      }
    }, intervalMs);
    return () => clearInterval(t);
  }, [fullKey, intervalMs]);

  return {
    read<R>(): R | null {
      if (typeof window === "undefined") return null;
      try {
        const raw = localStorage.getItem(fullKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { ts: number; data: R };
        // expire after 7 days
        if (Date.now() - parsed.ts > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(fullKey);
          return null;
        }
        return parsed.data;
      } catch {
        return null;
      }
    },
    clear() {
      try {
        localStorage.removeItem(fullKey);
      } catch {}
    },
  };
}
