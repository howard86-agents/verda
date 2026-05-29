"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SEEDED_READER_MEMBERS } from "./reader-seed-data";

/**
 * Shape consumed by the existing reader UI. This is intentionally a
 * browser-only auth shim so production stays pure client-side MSW/Dexie
 * and never needs Auth.js/Postgres for the demo sign-in path.
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

const AUTH_STORAGE_KEY = "verda.member";
const DEFAULT_MEMBER = SEEDED_READER_MEMBERS[0];

function deriveInitial(name: string | null | undefined, email: string): string {
  const trimmed = (name ?? "").trim();
  if (trimmed.length > 0) {
    return trimmed.charAt(0).toUpperCase();
  }
  return email.charAt(0).toUpperCase();
}

function toAuthMember(member: typeof DEFAULT_MEMBER): AuthMember {
  return {
    id: member.id,
    email: member.email,
    name: member.name,
    initial: deriveInitial(member.name, member.email),
  };
}

function readStoredMember(): AuthMember | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<AuthMember>;
    if (!(parsed.id && parsed.email && parsed.name)) {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      initial: parsed.initial ?? deriveInitial(parsed.name, parsed.email),
    };
  } catch {
    return null;
  }
}

/**
 * `useAuth()` preserves the legacy `{ member, login, logout }` surface
 * without a server session. The in-product "Sign in" button logs in as
 * a seeded reader stored in localStorage, matching the rest of the
 * client-side MSW demo state.
 */
export function useAuth(): AuthCtx {
  const [member, setMember] = useState<AuthMember | null>(null);

  useEffect(() => {
    setMember(readStoredMember());
  }, []);

  const login = useCallback(() => {
    const next = toAuthMember(DEFAULT_MEMBER);
    setMember(next);
    try {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // In-memory state is enough when storage is unavailable.
    }
  }, []);

  const logout = useCallback(() => {
    setMember(null);
    try {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return useMemo(() => ({ member, login, logout }), [member, login, logout]);
}
