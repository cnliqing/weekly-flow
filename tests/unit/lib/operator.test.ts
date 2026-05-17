import { describe, expect, it } from "vitest";
import { getSystemOperator } from "../../../lib/operator";

describe("getSystemOperator", () => {
  it("returns a stable open-access operator for privileged writes", () => {
    expect(getSystemOperator()).toEqual({
      email: "open-access@local",
      name: "开放访问用户",
      role: "admin",
    });
  });
});
