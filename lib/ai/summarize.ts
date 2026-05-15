import { createChatCompletion } from "./client";
import {
  buildSummarizePrompt,
  type WeeklyReportSummaryPromptInput,
} from "./prompts";
import type { WeeklyReportInput } from "@/lib/report-template";

export type SummarizeWeeklyReportsInput = WeeklyReportSummaryPromptInput;

export async function summarizeWeeklyReports(
  input: SummarizeWeeklyReportsInput,
): Promise<WeeklyReportInput> {
  const content = await createChatCompletion({
    responseFormat: "json_object",
    messages: [
      {
        role: "system",
        content:
          "你是严谨的项目周报汇总助手，只基于输入事实整理结构化 JSON。",
      },
      {
        role: "user",
        content: buildSummarizePrompt(input),
      },
    ],
  });

  return normalizeWeeklyReport(parseJsonObject(content), input);
}

function normalizeWeeklyReport(
  value: unknown,
  fallback: SummarizeWeeklyReportsInput,
): WeeklyReportInput {
  if (!isRecord(value)) {
    throw new Error("AI 汇总结果不是有效 JSON 对象。");
  }

  return {
    title: readString(value.title) || fallback.title,
    workItems: readStringArray(value.workItems),
    delayItems: readStringArray(value.delayItems),
    aiAnalysis: readString(value.aiAnalysis),
    problemItems: readStringArray(value.problemItems),
    nextPlanItems: readStringArray(value.nextPlanItems),
    nextPlanTitle: readString(value.nextPlanTitle) || fallback.nextPlanTitle,
  };
}

function parseJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("AI 汇总结果无法解析为 JSON。");
    }

    return JSON.parse(match[0]);
  }
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
