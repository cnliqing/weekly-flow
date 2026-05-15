export type WeeklyRange = {
  weekStartDate: string;
  weekEndDate: string;
  nextWeekStartDate: string;
  nextWeekEndDate: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function atUtcDate(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getWeeklyRange(startDate: Date): WeeklyRange {
  const date = atUtcDate(startDate);
  const isoDay = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  const monday = addDays(date, 1 - isoDay);

  return {
    weekStartDate: formatDate(monday),
    weekEndDate: formatDate(addDays(monday, 4)),
    nextWeekStartDate: formatDate(addDays(monday, 7)),
    nextWeekEndDate: formatDate(addDays(monday, 11)),
  };
}
