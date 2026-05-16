import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或无管理员权限。" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { cycleId?: unknown; finalContent?: unknown }
    | null;
  const cycleId = typeof body?.cycleId === "string" ? body.cycleId.trim() : "";
  const finalContent =
    typeof body?.finalContent === "string" ? body.finalContent.trim() : "";

  if (!cycleId) {
    return NextResponse.json({ error: "缺少周报周期 ID。" }, { status: 400 });
  }

  if (!finalContent) {
    return NextResponse.json({ error: "定稿内容不能为空。" }, { status: 400 });
  }

  const cycle = await prisma.weeklyReportCycle.findUnique({
    where: {
      id: cycleId,
    },
  });

  if (!cycle) {
    return NextResponse.json({ error: "周报周期不存在。" }, { status: 404 });
  }

  const report = await prisma.consolidatedReport.upsert({
    where: {
      cycleId,
    },
    update: {
      finalContent,
      status: "finalized",
      updatedBy: session.user.email ?? session.user.name ?? "admin",
    },
    create: {
      cycleId,
      finalContent,
      status: "finalized",
      updatedBy: session.user.email ?? session.user.name ?? "admin",
    },
  });

  return NextResponse.json({ report });
}
