import { NextRequest, NextResponse } from "next/server";
import { getAiModel } from "@/lib/ai/client";
import { polishWeeklyReport } from "@/lib/ai/polish";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或无管理员权限。" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { cycleId?: unknown; reportContent?: unknown }
    | null;

  const cycleId = typeof body?.cycleId === "string" ? body.cycleId.trim() : "";
  const explicitReportContent =
    typeof body?.reportContent === "string" ? body.reportContent : "";

  const cycle = cycleId
    ? await prisma.weeklyReportCycle.findUnique({
        where: {
          id: cycleId,
        },
        include: {
          consolidatedReport: true,
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

  const reportContent =
    explicitReportContent ||
    cycle?.consolidatedReport?.draftContent ||
    cycle?.consolidatedReport?.finalContent ||
    cycle?.consolidatedReport?.polishedContent ||
    "";

  const requestPayload = {
    cycleId: cycle?.id,
    reportContent,
  };

  try {
    const result = await polishWeeklyReport({ reportContent });

    const consolidatedReport = cycle
      ? await prisma.consolidatedReport.upsert({
          where: {
            cycleId: cycle.id,
          },
          update: {
            polishedContent: result.polishedContent,
            updatedBy: session.user.email ?? session.user.name ?? "admin",
          },
          create: {
            cycleId: cycle.id,
            polishedContent: result.polishedContent,
            updatedBy: session.user.email ?? session.user.name ?? "admin",
          },
        })
      : null;

    await prisma.aiRunLog.create({
      data: {
        projectId,
        cycleId: cycle?.id,
        type: "polish",
        model: getAiModel() || "unconfigured",
        requestPayload,
        responsePayload: result,
        success: true,
      },
    });

    return NextResponse.json({ ...result, consolidatedReport });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 润色失败，请稍后重试。";

    await prisma.aiRunLog.create({
      data: {
        projectId,
        cycleId: cycle?.id,
        type: "polish",
        model: getAiModel() || "unconfigured",
        requestPayload,
        success: false,
        errorMessage: message,
      },
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
