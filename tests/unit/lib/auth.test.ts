import { describe, expect, it } from "vitest";
import { isAdminRole } from "../../../lib/auth-helpers";

describe("isAdminRole", () => {
  it("accepts only admin as privileged role", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("member")).toBe(false);
  });
});
