import { describe, expect, it } from "vitest";
import { formatAiRunType } from "../../../lib/ai-run";

describe("formatAiRunType", () => {
  it("renders AI run types in Chinese", () => {
    expect(formatAiRunType("plan_check")).toBe("计划承接检查");
    expect(formatAiRunType("summarize")).toBe("AI 汇总");
    expect(formatAiRunType("polish")).toBe("AI 润色");
  });
});
