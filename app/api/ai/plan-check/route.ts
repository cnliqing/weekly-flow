import { NextRequest, NextResponse } from "next/server";
import { getAiModel } from "@/lib/ai/client";
import { checkPlanWithAi } from "@/lib/ai/plan-check";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PlanCheckBody = {
  cycleId?: unknown;
  memberName?: unknown;
  previousPlanItems?: unknown;
  currentWorkItems?: unknown;
  currentProblemItems?: unknown;
  freeTextContent?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或无管理员权限。" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PlanCheckBody | null;
  const cycleId = typeof body?.cycleId === "string" ? body.cycleId.trim() : "";
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

  const projectId =
    cycle?.projectId ??
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

  const requestPayload = {
    memberName: typeof body?.memberName === "string" ? body.memberName : undefined,
    previousPlanItems: readStringArray(body?.previousPlanItems),
    currentWorkItems: readStringArray(body?.currentWorkItems),
    currentProblemItems: readStringArray(body?.currentProblemItems),
    freeTextContent:
      typeof body?.freeTextContent === "string" ? body.freeTextContent : "",
  };

  try {
    const result = await checkPlanWithAi(requestPayload);

    await prisma.aiRunLog.create({
      data: {
        projectId,
        cycleId: cycle?.id,
        type: "plan_check",
        model: getAiModel() || "unconfigured",
        requestPayload,
        responsePayload: result,
        success: true,
      },
    });

    return NextResponse.json({ planCheck: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 承接检查失败，请稍后重试。";

    await prisma.aiRunLog.create({
      data: {
        projectId,
        cycleId: cycle?.id,
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

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}
