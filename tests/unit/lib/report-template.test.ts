import { describe, expect, it } from "vitest";
import { buildWeeklyReportTemplate } from "../../../lib/report-template";

describe("buildWeeklyReportTemplate", () => {
  it("renders the fixed weekly report sections in order without inventing empty content", () => {
    const report = buildWeeklyReportTemplate({
      title: "2026-05-11 周报",
      workItems: ["完成成员填写流程"],
      nextPlanTitle: "下周工作计划（2026-05-18 至 2026-05-22）",
      nextPlanItems: [],
    });

    expect(report).toContain("# 2026-05-11 周报");
    expect(report.indexOf("【本周工作情况】")).toBeLessThan(
      report.indexOf("【工作事项延期情况说明】"),
    );
    expect(report.indexOf("【工作事项延期情况说明】")).toBeLessThan(
      report.indexOf("【AI审核效果分析】"),
    );
    expect(report.indexOf("【AI审核效果分析】")).toBeLessThan(
      report.indexOf("【问题及解决办法】"),
    );
    expect(report.indexOf("【问题及解决办法】")).toBeLessThan(
      report.indexOf("【下周工作计划（2026-05-18 至 2026-05-22）】"),
    );
    expect(report).toContain("- 完成成员填写流程");
    expect(report).not.toContain("暂无");
  });
});
