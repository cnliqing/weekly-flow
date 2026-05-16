export type WeeklyRange = {
  weekStartDate: string;
  weekEndDate: string;
  nextWeekStartDate: string;
  nextWeekEndDate: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getDateInTimeZone(date: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Unable to format date in time zone: ${timeZone}`);
  }

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getWeeklyRange(
  startDate: Date,
  timeZone = "Asia/Shanghai",
): WeeklyRange {
  const date = getDateInTimeZone(startDate, timeZone);
  const isoDay = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  const monday = addDays(date, 1 - isoDay);

  return {
    weekStartDate: formatDate(monday),
    weekEndDate: formatDate(addDays(monday, 4)),
    nextWeekStartDate: formatDate(addDays(monday, 7)),
    nextWeekEndDate: formatDate(addDays(monday, 11)),
  };
}
