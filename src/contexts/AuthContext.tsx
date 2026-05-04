"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { COLLECTIONS, getDocById, upsertDoc } from "@/lib/firestore";
import type { UserProfile, UserRole } from "@/types/cms";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ?? "";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

const DEV_FAKE_PROFILE: UserProfile = {
  id: "dev-bypass-uid",
  email: "dev@local",
  displayName: "DEV (우회 모드)",
  photoURL: "",
  role: "superadmin",
  status: "active",
  createdAt: new Date(0).toISOString(),
  lastLoginAt: new Date().toISOString(),
};

const CACHE_KEY = "withcom.auth.profile.v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedProfile {
  profile: UserProfile;
  ts: number;
}

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: () => Promise<void>;
  signOutNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readCache(uid: string): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}.${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedProfile;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.profile;
  } catch {
    return null;
  }
}

function writeCache(profile: UserProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${CACHE_KEY}.${profile.id}`,
      JSON.stringify({ profile, ts: Date.now() } satisfies CachedProfile),
    );
  } catch {
    // ignore quota errors
  }
}

async function ensureUserProfile(fbUser: FirebaseUser): Promise<UserProfile> {
  const existing = await getDocById<UserProfile>(COLLECTIONS.USERS, fbUser.uid);

  const isSuper =
    SUPER_ADMIN_EMAIL.length > 0 &&
    fbUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

  let role: UserRole = "user";
  if (isSuper) role = "superadmin";
  else if (existing?.role) role = existing.role;

  const profile: UserProfile = {
    id: fbUser.uid,
    email: fbUser.email ?? "",
    displayName: fbUser.displayName ?? existing?.displayName ?? "",
    photoURL: fbUser.photoURL ?? existing?.photoURL ?? "",
    role,
    status: existing?.status ?? "active",
    createdAt: existing?.createdAt,
    lastLoginAt: new Date().toISOString(),
  };

  await upsertDoc(COLLECTIONS.USERS, fbUser.uid, {
    email: profile.email,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    role: profile.role,
    status: profile.status,
    lastLoginAt: profile.lastLoginAt,
    ...(existing ? {} : { createdAt: new Date().toISOString() }),
  });

  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEV_BYPASS) {
      setProfile(DEV_FAKE_PROFILE);
      setUser({
        uid: DEV_FAKE_PROFILE.id,
        email: DEV_FAKE_PROFILE.email,
        displayName: DEV_FAKE_PROFILE.displayName,
        photoURL: DEV_FAKE_PROFILE.photoURL,
      } as unknown as FirebaseUser);
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(fbUser);

      const cached = readCache(fbUser.uid);
      if (cached) {
        setProfile(cached);
        setLoading(false);
      }

      try {
        const fresh = await ensureUserProfile(fbUser);
        setProfile(fresh);
        writeCache(fresh);
      } catch (e) {
        console.error("Failed to ensure user profile:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(async () => {
    if (DEV_BYPASS) return;
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOutNow = useCallback(async () => {
    if (DEV_BYPASS) {
      setProfile(null);
      setUser(null);
      return;
    }
    if (typeof window !== "undefined") {
      try {
        const keys = Object.keys(localStorage).filter((k) =>
          k.startsWith(CACHE_KEY),
        );
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {
        // ignore
      }
    }
    await signOut(auth);
  }, []);

  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";
  const isSuperAdmin = profile?.role === "superadmin";

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isAdmin, isSuperAdmin, signIn, signOutNow }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
