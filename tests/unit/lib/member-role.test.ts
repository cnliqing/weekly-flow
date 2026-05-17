import { describe, expect, it } from "vitest";
import {
  formatMemberRole,
  isFillableMemberRole,
  normalizeMemberRole,
} from "../../../lib/member-role";

describe("member role helpers", () => {
  it("formats project roles in Chinese", () => {
    expect(formatMemberRole("manager")).toBe("项目经理");
    expect(formatMemberRole("developer")).toBe("开发");
  });

  it("normalizes form role values", () => {
    expect(normalizeMemberRole("manager")).toBe("manager");
    expect(normalizeMemberRole("developer")).toBe("developer");
    expect(normalizeMemberRole("bad-value")).toBe("developer");
    expect(normalizeMemberRole(null)).toBe("developer");
  });

  it("only developers appear in the member submission flow", () => {
    expect(isFillableMemberRole("developer")).toBe(true);
    expect(isFillableMemberRole("manager")).toBe(false);
  });
});
