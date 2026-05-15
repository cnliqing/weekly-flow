import { prisma } from "./prisma";
import { getWeeklyRange } from "./report-date-range";

export const DEFAULT_PROJECT_NAME = "周报通";

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export async function getDefaultProject() {
  return prisma.project.findUnique({
    where: {
      name: DEFAULT_PROJECT_NAME,
    },
  });
}

export async function createCurrentWeekCycle(projectId: string) {
  const range = getWeeklyRange(new Date());
  const weekStartDate = parseDate(range.weekStartDate);

  return prisma.weeklyReportCycle.upsert({
    where: {
      projectId_weekStartDate: {
        projectId,
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
      projectId,
      weekStartDate,
      weekEndDate: parseDate(range.weekEndDate),
      nextWeekStartDate: parseDate(range.nextWeekStartDate),
      nextWeekEndDate: parseDate(range.nextWeekEndDate),
      title: `${range.weekStartDate} 周报`,
      status: "open",
    },
  });
}
