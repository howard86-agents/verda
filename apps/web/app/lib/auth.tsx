"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useCallback, useMemo } from "react";

/**
 * Shape consumed by the existing reader UI (issue #127). The fields
 * mirror the legacy localStorage stub so callers in
 * `_components/*.tsx`, `(site)/.../page.tsx`, and friends round-trip
 * unchanged when the implementation flips onto Auth.js v5.
 */
export interface AuthMember {
  email: string;
  id: string;
  initial: string;
  name: string;
}

interface AuthCtx {
  login: () => void;
  logout: () => void;
  member: AuthMember | null;
}

/**
 * Default email used by the in-product "Sign in" button in
 * `top-nav.tsx` and `auth-gate.tsx`. The legacy stub logged the user
 * in as the seeded `MEMBER` (Mira Tanaka) immediately; we preserve
 * that behaviour by passing her email to the Credentials provider.
 * A future slice (#127's follow-on or a real magic-link flow) can
 * surface a real form.
 */
const DEFAULT_DEMO_EMAIL = "mira.t@example.com";

function deriveInitial(name: string | null | undefined, email: string): string {
  const trimmed = (name ?? "").trim();
  if (trimmed.length > 0) {
    return trimmed.charAt(0).toUpperCase();
  }
  return email.charAt(0).toUpperCase();
}

/**
 * `useAuth()` is a thin shim over `useSession()` (issue #127). It
 * collapses Auth.js's `{ data, status }` shape into the legacy
 * `{ member, login, logout }` interface so every caller in
 * `_components/`, `(site)/`, and `lib/use-collection.ts` keeps
 * working. The client component tree stays unchanged.
 */
export function useAuth(): AuthCtx {
  const { data: session } = useSession();

  const member = useMemo<AuthMember | null>(() => {
    if (!session?.user?.email) {
      return null;
    }
    const id = session.user.id ?? "";
    if (!id) {
      return null;
    }
    return {
      id,
      email: session.user.email,
      name: session.user.name ?? "",
      initial: deriveInitial(session.user.name, session.user.email),
    };
  }, [session]);

  const login = useCallback(() => {
    signIn("credentials", {
      email: DEFAULT_DEMO_EMAIL,
      redirect: false,
    }).catch(() => {
      // Sign-in failures surface via `useSession()` returning a
      // null user; we don't gate the UI on the call's resolution.
    });
  }, []);

  const logout = useCallback(() => {
    signOut({ redirect: false }).catch(() => {
      // Same rationale as `login`: any failure leaves the session
      // untouched, which is the safe default.
    });
  }, []);

  return { member, login, logout };
}
