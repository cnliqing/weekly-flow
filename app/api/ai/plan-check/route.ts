import { NextRequest, NextResponse } from "next/server";
import { getAiModel } from "@/lib/ai/client";
import { checkPlanWithAi } from "@/lib/ai/plan-check";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeStructuredContent,
  type SubmissionStructuredContent,
} from "@/lib/submission";

export const dynamic = "force-dynamic";

type PlanCheckBody = {
  cycleId?: unknown;
  submissionId?: unknown;
  memberName?: unknown;
  previousPlanItems?: unknown;
  currentWorkItems?: unknown;
  currentProblemItems?: unknown;
  freeTextContent?: unknown;
  memberId?: unknown;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as PlanCheckBody | null;
  const cycleId = typeof body?.cycleId === "string" ? body.cycleId.trim() : "";
  const submissionId =
    typeof body?.submissionId === "string" ? body.submissionId.trim() : "";
  const memberId = typeof body?.memberId === "string" ? body.memberId.trim() : "";
  const cycle = cycleId
    ? await prisma.weeklyReportCycle.findUnique({
        where: {
          id: cycleId,
        },
      })
    : null;

  if (cycleId && !cycle) {
    return NextResponse.json({ error: "周报周期不存在。" }, { status: 404 });
  }

  const submission = submissionId
    ? await prisma.memberSubmission.findUnique({
        where: {
          id: submissionId,
        },
        include: {
          member: true,
          cycle: true,
        },
      })
    : null;
  const session = await getAdminSession();
  const isMemberScopedRequest =
    Boolean(submission) && memberId.length > 0 && memberId === submission?.memberId;

  if (!session && !isMemberScopedRequest) {
    return NextResponse.json({ error: "未登录或无管理员权限。" }, { status: 401 });
  }

  if (submissionId && !submission) {
    return NextResponse.json({ error: "成员提交不存在。" }, { status: 404 });
  }

  if (cycle && submission && submission.cycleId !== cycle.id) {
    return NextResponse.json(
      { error: "成员提交不属于当前周报周期。" },
      { status: 400 },
    );
  }

  const projectId =
    cycle?.projectId ??
    submission?.cycle.projectId ??
    (
      await prisma.project.findFirst({
        orderBy: {
          createdAt: "asc",
        },
      })
    )?.id;

  if (!projectId) {
    return NextResponse.json({ error: "项目不存在，无法记录 AI 运行日志。" }, { status: 404 });
  }

  const storedContent = normalizeStructuredContent(
    submission?.structuredContent as Partial<SubmissionStructuredContent> | null,
  );
  const previousSubmission = submission
    ? await prisma.memberSubmission.findFirst({
        where: {
          cycle: {
            projectId: submission.cycle.projectId,
            weekStartDate: {
              lt: submission.cycle.weekStartDate,
            },
          },
          memberId: submission.memberId,
        },
        orderBy: {
          cycle: {
            weekStartDate: "desc",
          },
        },
      })
    : null;
  const previousContent = normalizeStructuredContent(
    previousSubmission?.structuredContent as Partial<SubmissionStructuredContent> | null,
  );
  const requestPayload = {
    memberName:
      typeof body?.memberName === "string"
        ? body.memberName
        : submission?.member.name,
    previousPlanItems: readStringArray(
      body?.previousPlanItems,
      previousContent.nextPlanItems,
    ),
    currentWorkItems: readStringArray(body?.currentWorkItems, storedContent.workItems),
    currentProblemItems: readStringArray(
      body?.currentProblemItems,
      storedContent.problemItems,
    ),
    freeTextContent:
      typeof body?.freeTextContent === "string"
        ? body.freeTextContent
        : submission?.freeTextContent ?? "",
  };

  try {
    const result = await checkPlanWithAi(requestPayload);

    const updatedSubmission = submission
      ? await prisma.memberSubmission.update({
          where: {
            id: submission.id,
          },
          data: {
            planCheckSummary: result.summary,
            planCheckWarnings: result,
          },
        })
      : null;

    await prisma.aiRunLog.create({
      data: {
        projectId,
        cycleId: cycle?.id ?? submission?.cycleId,
        type: "plan_check",
        model: getAiModel() || "unconfigured",
        requestPayload,
        responsePayload: result,
        success: true,
      },
    });

    return NextResponse.json({ planCheck: result, submission: updatedSubmission });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 承接检查失败，请稍后重试。";

    await prisma.aiRunLog.create({
      data: {
        projectId,
        cycleId: cycle?.id ?? submission?.cycleId,
        type: "plan_check",
        model: getAiModel() || "unconfigured",
        requestPayload,
        success: false,
        errorMessage: message,
      },
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function readStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}
