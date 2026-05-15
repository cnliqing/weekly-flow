import { PrismaClient } from "@prisma/client";
import { getWeeklyRange } from "../lib/report-date-range";

const prisma = new PrismaClient();

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

async function main() {
  const project = await prisma.project.upsert({
    where: { name: "周报通" },
    update: {
      description: "默认周报项目",
    },
    create: {
      name: "周报通",
      description: "默认周报项目",
    },
  });

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
  await prisma.weeklyReportCycle.upsert({
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
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
