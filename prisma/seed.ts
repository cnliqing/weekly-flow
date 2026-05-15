import { PrismaClient } from "@prisma/client";
import { getWeeklyRange } from "../lib/report-date-range";

const prisma = new PrismaClient();

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

async function main() {
  const existingProject = await prisma.project.findFirst({
    where: { name: "周报通" },
  });

  const project =
    existingProject ??
    (await prisma.project.create({
      data: {
        name: "周报通",
        description: "默认周报项目",
      },
    }));

  await Promise.all([
    prisma.member.upsert({
      where: {
        projectId_name: {
          projectId: project.id,
          name: "管理员",
        },
      },
      update: {
        role: "admin",
        isActive: true,
      },
      create: {
        projectId: project.id,
        name: "管理员",
        role: "admin",
      },
    }),
    prisma.member.upsert({
      where: {
        projectId_name: {
          projectId: project.id,
          name: "张三",
        },
      },
      update: {
        role: "member",
        isActive: true,
      },
      create: {
        projectId: project.id,
        name: "张三",
      },
    }),
    prisma.member.upsert({
      where: {
        projectId_name: {
          projectId: project.id,
          name: "李四",
        },
      },
      update: {
        role: "member",
        isActive: true,
      },
      create: {
        projectId: project.id,
        name: "李四",
      },
    }),
  ]);

  const range = getWeeklyRange(new Date());
  const weekStartDate = parseDate(range.weekStartDate);
  const existingCycle = await prisma.weeklyReportCycle.findFirst({
    where: {
      projectId: project.id,
      weekStartDate,
    },
  });

  const cycleData = {
    projectId: project.id,
    weekStartDate,
    weekEndDate: parseDate(range.weekEndDate),
    nextWeekStartDate: parseDate(range.nextWeekStartDate),
    nextWeekEndDate: parseDate(range.nextWeekEndDate),
    title: `${range.weekStartDate} 周报`,
    status: "open" as const,
  };

  if (existingCycle) {
    await prisma.weeklyReportCycle.update({
      where: { id: existingCycle.id },
      data: {
        weekEndDate: cycleData.weekEndDate,
        nextWeekStartDate: cycleData.nextWeekStartDate,
        nextWeekEndDate: cycleData.nextWeekEndDate,
        status: cycleData.status,
      },
    });
    return;
  }

  await prisma.weeklyReportCycle.create({
    data: cycleData,
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
