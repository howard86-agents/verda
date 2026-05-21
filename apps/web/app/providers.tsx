"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AuthProvider } from "./lib/auth";
import { CmsAuthProvider } from "./lib/cms-auth";
import { seedIfEmpty } from "./lib/seed";

interface ThemeCtx {
  dark: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within Providers");
  }
  return ctx;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

async function initMocks() {
  if (typeof window === "undefined") {
    return;
  }
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem("verda.dark") === "1") {
        setDark(true);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      window.localStorage.setItem("verda.dark", dark ? "1" : "0");
    } catch {
      // ignore
    }
  }, [dark, hydrated]);

  useEffect(() => {
    async function boot() {
      await initMocks();
      await seedIfEmpty();
      setReady(true);
    }
    boot();
  }, []);

  const toggleDark = useCallback(() => setDark((d) => !d), []);
  const value = useMemo(() => ({ dark, toggleDark }), [dark, toggleDark]);

  if (!ready) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CmsAuthProvider>{children}</CmsAuthProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeContext.Provider>
  );
}
