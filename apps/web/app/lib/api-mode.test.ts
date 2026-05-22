import { describe, expect, test } from "bun:test";
import { isRealApiMode } from "./api-mode";

describe("isRealApiMode() — issue #126", () => {
  test("treats the literal string 'real' as real-backend mode", () => {
    expect(isRealApiMode("real")).toBe(true);
  });

  test("treats undefined as mock mode (the safe default)", () => {
    expect(isRealApiMode(undefined)).toBe(false);
  });

  test("treats unknown values as mock mode", () => {
    expect(isRealApiMode("staging")).toBe(false);
    expect(isRealApiMode("")).toBe(false);
    expect(isRealApiMode("REAL")).toBe(false);
  });

  test("treats the documented 'mock' value as mock mode", () => {
    expect(isRealApiMode("mock")).toBe(false);
  });
});
