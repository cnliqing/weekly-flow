import { describe, expect, it } from "vitest";
import { formatHistoryCycleStatus } from "../../../lib/history-format";

describe("formatHistoryCycleStatus", () => {
  it("formats cycle status with Chinese labels", () => {
    expect(formatHistoryCycleStatus("draft")).toBe("草稿");
    expect(formatHistoryCycleStatus("open")).toBe("开放中");
    expect(formatHistoryCycleStatus("closed")).toBe("已关闭");
    expect(formatHistoryCycleStatus("archived")).toBe("已归档");
  });
});
