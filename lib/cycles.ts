import { prisma } from "./prisma";
import { getWeeklyRange } from "./report-date-range";

export const DEFAULT_PROJECT_NAME = "周报通";

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
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
  const weekStartDate = parseDate(range.weekStartDate);
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
        weekEndDate: parseDate(range.weekEndDate),
        nextWeekStartDate: parseDate(range.nextWeekStartDate),
        nextWeekEndDate: parseDate(range.nextWeekEndDate),
        title: `${range.weekStartDate} 周报`,
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
      weekEndDate: parseDate(range.weekEndDate),
      nextWeekStartDate: parseDate(range.nextWeekStartDate),
      nextWeekEndDate: parseDate(range.nextWeekEndDate),
      title: `${range.weekStartDate} 周报`,
      status: "open",
    },
  });

  return {
    cycle,
    created: true,
  };
}
