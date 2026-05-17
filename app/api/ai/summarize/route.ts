import { NextRequest, NextResponse } from "next/server";
import { getAiModel } from "@/lib/ai/client";
import { summarizeWeeklyReports } from "@/lib/ai/summarize";
import { getSystemOperator } from "@/lib/operator";
import { prisma } from "@/lib/prisma";
import { renderWeeklyReport } from "@/lib/report-template";
import {
  normalizeStructuredContent,
  type SubmissionStructuredContent,
} from "@/lib/submission";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const operator = getSystemOperator();

  const body = (await request.json().catch(() => null)) as
    | { cycleId?: unknown }
    | null;

  if (!body || typeof body.cycleId !== "string" || body.cycleId.trim() === "") {
    return NextResponse.json({ error: "缺少周报周期 ID。" }, { status: 400 });
  }

  const cycle = await prisma.weeklyReportCycle.findUnique({
    where: {
      id: body.cycleId.trim(),
    },
    include: {
      submissions: {
        include: {
          member: true,
        },
        orderBy: {
          submittedAt: "asc",
        },
      },
    },
  });

  if (!cycle) {
    return NextResponse.json({ error: "周报周期不存在。" }, { status: 404 });
  }

  const summaryInput = {
    title: cycle.title,
    nextPlanTitle: `下周工作计划（${formatDate(cycle.nextWeekStartDate)} 至 ${formatDate(cycle.nextWeekEndDate)}）`,
    submissions: cycle.submissions.map((submission) => {
      const content = normalizeStructuredContent(
        submission.structuredContent as Partial<SubmissionStructuredContent>,
      );

      return {
        memberName: submission.member.name,
        workItems: content.workItems,
        delayItems: content.delayItems,
        problemItems: content.problemItems,
        nextPlanItems: content.nextPlanItems,
        freeTextContent: submission.freeTextContent,
        planCheckSummary: submission.planCheckSummary,
      };
    }),
  };

  try {
    const reportInput = await summarizeWeeklyReports(summaryInput);
    const draftContent = renderWeeklyReport(reportInput);
    const consolidatedReport = await prisma.consolidatedReport.upsert({
      where: {
        cycleId: cycle.id,
      },
      update: {
        draftContent,
        updatedBy: operator.email,
      },
      create: {
        cycleId: cycle.id,
        draftContent,
        updatedBy: operator.email,
      },
    });

    await prisma.aiRunLog.create({
      data: {
        projectId: cycle.projectId,
        cycleId: cycle.id,
        type: "summarize",
        model: getAiModel() || "unconfigured",
        requestPayload: summaryInput,
        responsePayload: reportInput,
        success: true,
      },
    });

    return NextResponse.json({ reportInput, draftContent, consolidatedReport });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 汇总失败，请稍后重试。";

    await prisma.aiRunLog.create({
      data: {
        projectId: cycle.projectId,
        cycleId: cycle.id,
        type: "summarize",
        model: getAiModel() || "unconfigured",
        requestPayload: summaryInput,
        success: false,
        errorMessage: message,
      },
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
