import type { WeeklyReportInput } from "@/lib/report-template";

export type WeeklyReportSummarySubmission = {
  memberName: string;
  workItems: string[];
  delayItems: string[];
  problemItems: string[];
  nextPlanItems: string[];
  freeTextContent?: string | null;
  planCheckSummary?: string | null;
};

export type WeeklyReportSummaryPromptInput = {
  title: string;
  nextPlanTitle?: string;
  submissions: WeeklyReportSummarySubmission[];
};

export function buildSummarizePrompt(input: WeeklyReportSummaryPromptInput): string {
  return [
    "请将以下成员周报汇总为一份项目周报。",
    "必须只输出 JSON 对象，不要输出 Markdown 代码块、解释或额外文字。",
    "JSON 字段必须严格匹配：title, workItems, delayItems, aiAnalysis, problemItems, nextPlanItems, nextPlanTitle。",
    "workItems、delayItems、problemItems、nextPlanItems 必须是字符串数组；aiAnalysis 必须是字符串。",
    "缺失的模块保持空数组或空字符串，不要编造未提供的信息。",
    "合并同类项，保留成员姓名和关键结果；延期、问题、风险要具体可追踪。",
    "",
    JSON.stringify(input, null, 2),
  ].join("\n");
}

export function buildPolishPrompt(reportContent: string): string {
  return [
    "请润色下面的项目周报正文。",
    "保持原有章节标题、事实和未填写状态，不要新增事实、指标或承诺。",
    "输出润色后的完整正文，不要输出解释。",
    "",
    reportContent,
  ].join("\n");
}

export type PlanCheckAiPromptInput = {
  memberName?: string;
  previousPlanItems: string[];
  currentWorkItems: string[];
  currentProblemItems: string[];
  freeTextContent?: string;
};

export function buildPlanCheckPrompt(input: PlanCheckAiPromptInput): string {
  return [
    "请检查成员本周内容是否承接了上周计划。",
    "必须只输出 JSON 对象，不要输出 Markdown 代码块、解释或额外文字。",
    "JSON 字段必须严格匹配：matchedItems, missingItems, summary。",
    "matchedItems 和 missingItems 必须是字符串数组；summary 必须是中文字符串。",
    "只能基于输入内容判断，不要编造完成情况。",
    "",
    JSON.stringify(input, null, 2),
  ].join("\n");
}

export function buildWeeklyReportJsonContract(): WeeklyReportInput {
  return {
    title: "",
    workItems: [],
    delayItems: [],
    aiAnalysis: "",
    problemItems: [],
    nextPlanItems: [],
    nextPlanTitle: "",
  };
}
