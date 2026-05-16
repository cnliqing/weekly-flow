import type { AiRunType } from "@prisma/client";

const aiRunTypeLabels: Record<AiRunType, string> = {
  plan_check: "计划承接检查",
  summarize: "AI 汇总",
  polish: "AI 润色",
};

export function formatAiRunType(type: AiRunType): string {
  return aiRunTypeLabels[type] ?? type;
}
