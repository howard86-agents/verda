import { describe, expect, test } from "bun:test";
import { initGA4, trackGA4Event, trackPageView } from "./ga4";

describe("GA4 adapter", () => {
  test("trackGA4Event no-ops without Measurement ID", () => {
    // Should not throw when no ID is configured
    expect(() => trackGA4Event("test_event", { foo: "bar" })).not.toThrow();
  });

  test("trackPageView no-ops without Measurement ID", () => {
    expect(() => trackPageView("/test")).not.toThrow();
  });

  test("initGA4 no-ops without Measurement ID", () => {
    expect(() => initGA4()).not.toThrow();
  });
});
