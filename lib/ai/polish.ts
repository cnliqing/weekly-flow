import { createChatCompletion } from "./client";
import { buildPolishPrompt } from "./prompts";

export type PolishWeeklyReportInput = {
  reportContent: string;
};

export async function polishWeeklyReport(
  input: PolishWeeklyReportInput,
): Promise<{ polishedContent: string }> {
  const reportContent = input.reportContent.trim();

  if (!reportContent) {
    throw new Error("缺少需要润色的周报正文。");
  }

  const polishedContent = await createChatCompletion({
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "你是项目周报编辑，只做语言润色和结构微调，不新增事实。",
      },
      {
        role: "user",
        content: buildPolishPrompt(reportContent),
      },
    ],
  });

  return { polishedContent };
}
