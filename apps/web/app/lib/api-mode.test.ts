import { describe, expect, test } from "bun:test";
import { apiMode, isRealApiMode } from "./api-mode";

describe("apiMode — production MSW-only", () => {
  test("always resolves to mock mode", () => {
    expect(apiMode).toBe("mock");
  });

  test("ignores stale real-backend env values", () => {
    expect(isRealApiMode("real")).toBe(false);
  });

  test("treats undefined, unknown, and documented mock values as MSW mode", () => {
    expect(isRealApiMode(undefined)).toBe(false);
    expect(isRealApiMode("staging")).toBe(false);
    expect(isRealApiMode("")).toBe(false);
    expect(isRealApiMode("REAL")).toBe(false);
    expect(isRealApiMode("mock")).toBe(false);
  });
});
