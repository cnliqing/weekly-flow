import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createCurrentWeekCycle, getDefaultProject } from "@/lib/cycles";

export const dynamic = "force-dynamic";

export async function POST() {
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

  const cycle = await createCurrentWeekCycle(project.id);

  return NextResponse.json({ cycle }, { status: 201 });
}
