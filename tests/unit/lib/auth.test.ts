import { describe, expect, it } from "vitest";
import {
  isAdminRole,
  sanitizeAdminCallbackUrl,
} from "../../../lib/auth-helpers";

describe("isAdminRole", () => {
  it("accepts only admin as privileged role", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("member")).toBe(false);
  });
});

describe("sanitizeAdminCallbackUrl", () => {
  it("keeps admin relative paths", () => {
    expect(sanitizeAdminCallbackUrl("/admin/members")).toBe("/admin/members");
  });

  it("falls back for unsafe callback URLs", () => {
    expect(sanitizeAdminCallbackUrl("https://example.com")).toBe("/admin");
    expect(sanitizeAdminCallbackUrl("http://example.com")).toBe("/admin");
    expect(sanitizeAdminCallbackUrl("//evil.com")).toBe("/admin");
    expect(sanitizeAdminCallbackUrl("/member")).toBe("/admin");
    expect(sanitizeAdminCallbackUrl("")).toBe("/admin");
  });
});
