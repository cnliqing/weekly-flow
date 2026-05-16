import type { SubmissionStructuredContent } from "./submission";

export type PlanCheckResult = {
  matchedItems: string[];
  missingItems: string[];
  summary: string;
};

const ignoredTokens = new Set([
  "完成",
  "推进",
  "处理",
  "跟进",
  "优化",
  "支持",
  "本周",
  "下周",
  "计划",
  "事项",
]);

export function checkPlanCompletion(
  previousPlanItems: string[],
  currentContent: SubmissionStructuredContent,
  freeTextContent = "",
): PlanCheckResult {
  const searchableText = [
    ...currentContent.workItems,
    ...currentContent.problemItems,
    freeTextContent,
  ]
    .join("\n")
    .toLowerCase();

  const matchedItems: string[] = [];
  const missingItems: string[] = [];

  for (const item of previousPlanItems.map((value) => value.trim()).filter(Boolean)) {
    const keywords = extractKeywords(item);
    const matched =
      keywords.length === 0
        ? searchableText.includes(item.toLowerCase())
        : keywords.some((keyword) => searchableText.includes(keyword));

    if (matched) {
      matchedItems.push(item);
    } else {
      missingItems.push(item);
    }
  }

  return {
    matchedItems,
    missingItems,
    summary: `上周计划 ${matchedItems.length + missingItems.length} 项，已承接 ${matchedItems.length} 项，未体现 ${missingItems.length} 项。`,
  };
}

function extractKeywords(item: string): string[] {
  const normalized = item.toLowerCase();
  const asciiTokens = normalized.match(/[a-z0-9][a-z0-9_-]{1,}/g) ?? [];
  const cjkTokens = normalized.match(/[\u4e00-\u9fa5]{2,}/g) ?? [];

  return [...asciiTokens, ...cjkTokens]
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !ignoredTokens.has(token));
}
