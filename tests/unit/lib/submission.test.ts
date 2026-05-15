import { describe, expect, it } from "vitest";
import { upsertMemberSubmission } from "../../../lib/submission";

describe("upsertMemberSubmission", () => {
  it("keeps only the latest submission for the same cycle and member", async () => {
    const storedSubmissions = new Map<string, unknown>();
    const repository = {
      async upsert(data: unknown) {
        const input = data as {
          cycleId: string;
          memberId: string;
          structuredContent: unknown;
          freeTextContent?: string | null;
        };
        const key = `${input.cycleId}:${input.memberId}`;
        const previous = storedSubmissions.get(key) as
          | { id: string; submittedAt: Date }
          | undefined;
        const submission = {
          id: previous?.id ?? "submission-1",
          cycleId: input.cycleId,
          memberId: input.memberId,
          structuredContent: input.structuredContent,
          freeTextContent: input.freeTextContent,
          submittedAt: new Date("2026-05-16T00:00:00.000Z"),
        };
        storedSubmissions.set(key, submission);
        return submission;
      },
    };

    await upsertMemberSubmission(
      {
        cycleId: "cycle-1",
        memberId: "member-1",
        structuredContent: {
          workItems: ["完成旧事项"],
        },
        freeTextContent: "第一次提交",
      },
      repository,
    );

    const latest = await upsertMemberSubmission(
      {
        cycleId: "cycle-1",
        memberId: "member-1",
        structuredContent: {
          workItems: ["完成新事项"],
          nextPlanItems: ["下周计划"],
        },
        freeTextContent: "第二次提交",
      },
      repository,
    );

    expect(storedSubmissions).toHaveLength(1);
    expect(latest).toMatchObject({
      id: "submission-1",
      cycleId: "cycle-1",
      memberId: "member-1",
      freeTextContent: "第二次提交",
      structuredContent: {
        workItems: ["完成新事项"],
        delayItems: [],
        problemItems: [],
        nextPlanItems: ["下周计划"],
      },
    });
  });
});
