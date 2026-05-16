import { createChatCompletion } from "./client";
import { buildPlanCheckPrompt, type PlanCheckAiPromptInput } from "./prompts";
import type { PlanCheckResult } from "@/lib/plan-check";

export type CheckPlanWithAiInput = PlanCheckAiPromptInput;

export async function checkPlanWithAi(
  input: CheckPlanWithAiInput,
): Promise<PlanCheckResult> {
  const content = await createChatCompletion({
    responseFormat: "json_object",
    messages: [
      {
        role: "system",
        content:
          "你是项目计划承接审核助手，只根据输入内容判断计划是否体现。",
      },
      {
        role: "user",
        content: buildPlanCheckPrompt(input),
      },
    ],
  });

  return normalizePlanCheck(JSON.parse(content));
}

function normalizePlanCheck(value: unknown): PlanCheckResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("AI 承接检查结果不是有效 JSON 对象。");
  }

  const record = value as Record<string, unknown>;

  return {
    matchedItems: readStringArray(record.matchedItems),
    missingItems: readStringArray(record.missingItems),
    summary:
      typeof record.summary === "string" && record.summary.trim()
        ? record.summary.trim()
        : "AI 未返回有效承接检查摘要。",
  };
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
