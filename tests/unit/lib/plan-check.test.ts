import { describe, expect, it } from "vitest";
import { checkPlanCompletion } from "../../../lib/plan-check";

describe("checkPlanCompletion", () => {
  it("matches previous plan items against current structured and free text content", () => {
    const result = checkPlanCompletion(
      ["完成 billing 接口联调", "梳理客服 FAQ"],
      {
        workItems: ["billing 接口已经完成联调"],
        delayItems: [],
        problemItems: ["FAQ 数据源还缺少权限"],
        nextPlanItems: [],
      },
      "本周同步了客服 FAQ 的权限问题",
    );

    expect(result.matchedItems).toEqual([
      "完成 billing 接口联调",
      "梳理客服 FAQ",
    ]);
    expect(result.missingItems).toEqual([]);
    expect(result.summary).toBe("上周计划 2 项，已承接 2 项，未体现 0 项。");
  });

  it("reports missing items when current content has no matching keywords", () => {
    const result = checkPlanCompletion(
      ["完成移动端审批入口"],
      {
        workItems: ["修复导出样式"],
        delayItems: [],
        problemItems: [],
        nextPlanItems: [],
      },
    );

    expect(result.matchedItems).toEqual([]);
    expect(result.missingItems).toEqual(["完成移动端审批入口"]);
  });
});
