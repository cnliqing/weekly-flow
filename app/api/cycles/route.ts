import { NextRequest, NextResponse } from "next/server";
import { createCurrentWeekCycle, createReportCycleForRange } from "@/lib/cycles";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        projectId?: unknown;
        reportDate?: unknown;
        startDate?: unknown;
        endDate?: unknown;
      }
    | null;
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "缺少项目 ID。" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "项目不存在。" }, { status: 404 });
  }

  const startDate =
    typeof body?.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate)
      ? new Date(`${body.startDate}T00:00:00.000Z`)
      : null;
  const endDate =
    typeof body?.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.endDate)
      ? new Date(`${body.endDate}T00:00:00.000Z`)
      : null;
  const reportDate =
    typeof body?.reportDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.reportDate)
      ? new Date(`${body.reportDate}T00:00:00+08:00`)
      : new Date();

  if (
    (startDate && Number.isNaN(startDate.getTime())) ||
    (endDate && Number.isNaN(endDate.getTime())) ||
    Number.isNaN(reportDate.getTime())
  ) {
    return NextResponse.json({ error: "请选择有效日期。" }, { status: 400 });
  }

  if ((startDate && !endDate) || (!startDate && endDate)) {
    return NextResponse.json({ error: "请同时提供开始日期和结束日期。" }, { status: 400 });
  }

  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json({ error: "结束日期不能早于开始日期。" }, { status: 400 });
  }

  const { cycle, created } =
    startDate && endDate
      ? await createReportCycleForRange(projectId, startDate, endDate)
      : await createCurrentWeekCycle(projectId, reportDate);

  return NextResponse.json({ cycle, created }, { status: created ? 201 : 200 });
}
