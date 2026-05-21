import { describe, expect, test } from "bun:test";
import { type CmsAction, type CmsRole, can } from "./cms-auth";

const ROLES: CmsRole[] = ["editor", "publisher", "admin", "customer-service"];

describe("can() policy matrix", () => {
  const cases: [CmsAction, CmsRole[], CmsRole[]][] = [
    ["create_draft", ["editor", "publisher", "admin"], ["customer-service"]],
    ["edit_draft", ["editor", "publisher", "admin"], ["customer-service"]],
    ["publish", ["publisher", "admin"], ["editor", "customer-service"]],
    ["unpublish", ["publisher", "admin"], ["editor", "customer-service"]],
    ["manage_taxonomy", ["admin"], ["editor", "publisher", "customer-service"]],
    ["manage_rules", ["admin"], ["editor", "publisher", "customer-service"]],
    ["point_adjust", ["admin", "customer-service"], ["editor", "publisher"]],
    ["member_delete", ["admin"], ["editor", "publisher", "customer-service"]],
    ["upload_media", ["editor", "publisher", "admin"], ["customer-service"]],
  ];

  for (const [action, allowed, denied] of cases) {
    for (const role of allowed) {
      test(`${role} CAN ${action}`, () => {
        expect(can(action, role)).toBe(true);
      });
    }
    for (const role of denied) {
      test(`${role} CANNOT ${action}`, () => {
        expect(can(action, role)).toBe(false);
      });
    }
  }

  test("all roles are covered for every action", () => {
    for (const [_action, allowed, denied] of cases) {
      const covered = new Set([...allowed, ...denied]);
      for (const role of ROLES) {
        expect(covered.has(role)).toBe(true);
      }
    }
  });
});
