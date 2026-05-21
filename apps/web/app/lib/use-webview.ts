"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const WEBVIEW_UA_PATTERNS = [
  /\bwv\b/i, // Android WebView
  /WebView/i,
  /\bFBiOS\b/i, // Facebook in-app
  /\bLINE\b/i, // LINE in-app
];

/**
 * Detects WebView context via `?webview=1` query param or User-Agent patterns.
 * Persists for the session once detected.
 */
export function useWebView(): boolean {
  const searchParams = useSearchParams();

  return useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    // Check query param
    if (searchParams.get("webview") === "1") {
      return true;
    }

    // Check sessionStorage (sticky for the session)
    if (sessionStorage.getItem("verda.webview") === "1") {
      return true;
    }

    // Check UA
    const ua = navigator.userAgent;
    const isWebView = WEBVIEW_UA_PATTERNS.some((p) => p.test(ua));
    if (isWebView) {
      sessionStorage.setItem("verda.webview", "1");
    }
    return isWebView;
  }, [searchParams]);
}
