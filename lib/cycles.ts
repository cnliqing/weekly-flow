import { prisma } from "./prisma";
import { getWeeklyRange } from "./report-date-range";

export const DEFAULT_PROJECT_NAME = "周报通";

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getDefaultProject() {
  const defaultProject = await prisma.project.findUnique({
    where: {
      name: DEFAULT_PROJECT_NAME,
    },
  });

  if (defaultProject) {
    return defaultProject;
  }

  return prisma.project.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function createCurrentWeekCycle(projectId: string, date = new Date()) {
  const range = getWeeklyRange(date);
  return createReportCycleForRange(
    projectId,
    parseDate(range.weekStartDate),
    parseDate(range.weekEndDate),
  );
}

export async function createReportCycleForRange(
  projectId: string,
  weekStartDate: Date,
  weekEndDate: Date,
) {
  if (weekEndDate < weekStartDate) {
    throw new Error("结束日期不能早于开始日期。");
  }

  const title = `${formatDate(weekStartDate)}~${formatDate(weekEndDate)} 周报`;
  const existingCycle = await prisma.weeklyReportCycle.findUnique({
    where: {
      projectId_weekStartDate: {
        projectId,
        weekStartDate,
      },
    },
  });

  if (existingCycle) {
    const cycle = await prisma.weeklyReportCycle.update({
      where: {
        id: existingCycle.id,
      },
      data: {
        weekEndDate,
        nextWeekStartDate: addDays(weekStartDate, 7),
        nextWeekEndDate: addDays(weekEndDate, 7),
        title,
        status: "open",
      },
    });

    return {
      cycle,
      created: false,
    };
  }

  const cycle = await prisma.weeklyReportCycle.create({
    data: {
      projectId,
      weekStartDate,
      weekEndDate,
      nextWeekStartDate: addDays(weekStartDate, 7),
      nextWeekEndDate: addDays(weekEndDate, 7),
      title,
      status: "open",
    },
  });

  return {
    cycle,
    created: true,
  };
}
