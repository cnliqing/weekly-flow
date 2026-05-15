export type WeeklyReportTemplateInput = {
  title: string;
  workItems?: string[];
  delayItems?: string[];
  aiReviewItems?: string[];
  problemItems?: string[];
  nextPlanTitle?: string;
  nextPlanItems?: string[];
};

export function buildWeeklyReportTemplate(input: WeeklyReportTemplateInput): string {
  const nextPlanHeading = input.nextPlanTitle ?? "下周工作计划（...）";

  return [
    `# ${input.title}`,
    "",
    "【本周工作情况】",
    renderList(input.workItems),
    "",
    "【工作事项延期情况说明】",
    renderList(input.delayItems),
    "",
    "【AI审核效果分析】",
    renderList(input.aiReviewItems),
    "",
    "【问题及解决办法】",
    renderList(input.problemItems),
    "",
    `【${nextPlanHeading}】`,
    renderList(input.nextPlanItems),
  ].join("\n");
}

function renderList(items?: string[]): string {
  return (items ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join("\n");
}
