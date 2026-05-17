import { describe, expect, it } from "vitest";
import { formatCycleStatus } from "../../../lib/cycle-status";

describe("formatCycleStatus", () => {
  it("renders cycle statuses in Chinese", () => {
    expect(formatCycleStatus("draft")).toBe("草稿");
    expect(formatCycleStatus("open")).toBe("开放中");
    expect(formatCycleStatus("closed")).toBe("已关闭");
    expect(formatCycleStatus("archived")).toBe("已归档");
  });
});
