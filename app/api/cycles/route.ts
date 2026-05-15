import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWeeklyRange } from "@/lib/report-date-range";

export const dynamic = "force-dynamic";

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export async function POST() {
  const project = await prisma.project.upsert({
    where: {
      name: "周报通",
    },
    update: {},
    create: {
      name: "周报通",
      description: "默认周报项目",
    },
  });

  const range = getWeeklyRange(new Date());
  const weekStartDate = parseDate(range.weekStartDate);

  const cycle = await prisma.weeklyReportCycle.upsert({
    where: {
      projectId_weekStartDate: {
        projectId: project.id,
        weekStartDate,
      },
    },
    update: {
      weekEndDate: parseDate(range.weekEndDate),
      nextWeekStartDate: parseDate(range.nextWeekStartDate),
      nextWeekEndDate: parseDate(range.nextWeekEndDate),
      title: `${range.weekStartDate} 周报`,
      status: "open",
    },
    create: {
      projectId: project.id,
      weekStartDate,
      weekEndDate: parseDate(range.weekEndDate),
      nextWeekStartDate: parseDate(range.nextWeekStartDate),
      nextWeekEndDate: parseDate(range.nextWeekEndDate),
      title: `${range.weekStartDate} 周报`,
      status: "open",
    },
  });

  return NextResponse.json({ cycle }, { status: 201 });
}
