"use client";

import { MEMBER } from "@verda/data";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

const AuthContext = createContext<AuthCtx | null>(null);

const AUTH_KEY = "verda.auth";

const SEEDED_MEMBER: AuthMember = {
  id: MEMBER.memberId,
  name: MEMBER.name,
  email: MEMBER.email,
  initial: MEMBER.initial,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<AuthMember | null>(null);

  useEffect(() => {
    if (localStorage.getItem(AUTH_KEY) === "1") {
      setMember(SEEDED_MEMBER);
    }
  }, []);

  const login = useCallback(() => {
    setMember(SEEDED_MEMBER);
    localStorage.setItem(AUTH_KEY, "1");
  }, []);

  const logout = useCallback(() => {
    setMember(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  const value = useMemo(
    () => ({ member, login, logout }),
    [member, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
