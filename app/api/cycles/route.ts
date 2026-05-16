import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createCurrentWeekCycle, getDefaultProject } from "@/lib/cycles";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或无管理员权限。" }, { status: 401 });
  }

  const project = await getDefaultProject();

  if (!project) {
    return NextResponse.json(
      { error: "默认项目不存在，请先运行种子数据或创建项目。" },
      { status: 404 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { reportDate?: unknown }
    | null;
  const reportDate =
    typeof body?.reportDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.reportDate)
      ? new Date(`${body.reportDate}T00:00:00+08:00`)
      : new Date();

  if (Number.isNaN(reportDate.getTime())) {
    return NextResponse.json({ error: "请选择有效日期。" }, { status: 400 });
  }

  const { cycle, created } = await createCurrentWeekCycle(project.id, reportDate);

  return NextResponse.json({ cycle, created }, { status: created ? 201 : 200 });
}
