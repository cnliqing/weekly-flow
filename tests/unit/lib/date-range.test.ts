import { describe, expect, it } from "vitest";
import { getWeeklyRange } from "../../../lib/report-date-range";

describe("getWeeklyRange", () => {
  it("builds current week and next week ranges from a start date", () => {
    const range = getWeeklyRange(new Date("2026-05-15T00:00:00.000Z"));
    expect(range.weekStartDate).toBe("2026-05-11");
    expect(range.weekEndDate).toBe("2026-05-15");
    expect(range.nextWeekStartDate).toBe("2026-05-18");
    expect(range.nextWeekEndDate).toBe("2026-05-22");
  });
});
