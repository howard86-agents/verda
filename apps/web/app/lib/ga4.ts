/**
 * GA4 adapter — maps track() events to gtag, configurable per domain.
 * No-ops when no Measurement ID is configured for the current domain.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Domain → GA4 Measurement ID mapping. */
const MEASUREMENT_IDS: Record<string, string> = {
  // Add domain mappings here, e.g.:
  // "verda.com": "G-XXXXXXXXXX",
  // "staging.verda.com": "G-YYYYYYYYYY",
};

let initialized = false;
let lastPagePath: string | null = null;

function getMeasurementId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const envId = process.env.NEXT_PUBLIC_GA4_ID;
  if (envId) {
    return envId;
  }
  return MEASUREMENT_IDS[window.location.hostname] ?? null;
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push(args);
  }
}

/** Initialize the GA4 script tag if a Measurement ID is available. */
export function initGA4() {
  if (typeof window === "undefined") {
    return;
  }
  const id = getMeasurementId();
  if (!id) {
    return;
  }
  if (initialized) {
    return;
  }
  initialized = true;

  // Load gtag.js
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtagFn(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  gtag("js", new Date());
  gtag("config", id, { send_page_view: false });
}

/** Send a page_view event, deduplicating by path. */
export function trackPageView(path: string) {
  if (!getMeasurementId()) {
    return;
  }
  if (path === lastPagePath) {
    return;
  }
  lastPagePath = path;
  gtag("event", "page_view", { page_path: path });
}

/** Send a custom event to GA4. */
export function trackGA4Event(name: string, props?: Record<string, unknown>) {
  if (!getMeasurementId()) {
    return;
  }
  gtag("event", name, props ?? {});
}
