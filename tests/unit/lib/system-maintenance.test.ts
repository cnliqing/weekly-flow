import { describe, expect, it } from "vitest";
import {
  clearProjectData,
  type ProjectDataClient,
  type ProjectDataTransaction,
} from "../../../lib/system-maintenance";

type DeleteCall = {
  args: unknown;
  model: string;
};

function createFakeClient() {
  const calls: DeleteCall[] = [];
  const createModel = (name: string) => ({
    deleteMany: async (args?: unknown) => {
      calls.push({ args, model: name });
      return { count: 1 };
    },
  });

  const client: ProjectDataClient = {
    aiRunLog: createModel("aiRunLog"),
    consolidatedReport: createModel("consolidatedReport"),
    member: createModel("member"),
    memberSubmission: createModel("memberSubmission"),
    project: createModel("project"),
    weeklyReportCycle: createModel("weeklyReportCycle"),
    $transaction: async <T>(
      callback: (tx: ProjectDataTransaction) => Promise<T>,
    ) =>
      callback({
        aiRunLog: createModel("aiRunLog"),
        consolidatedReport: createModel("consolidatedReport"),
        member: createModel("member"),
        memberSubmission: createModel("memberSubmission"),
        project: createModel("project"),
        weeklyReportCycle: createModel("weeklyReportCycle"),
      }),
  };

  return {
    calls,
    client,
  };
}

describe("clearProjectData", () => {
  it("keeps projects and members when requested", async () => {
    const fake = createFakeClient();

    await clearProjectData(fake.client, { preserveMembers: true });

    expect(fake.calls.map((call) => call.model)).toEqual([
      "aiRunLog",
      "consolidatedReport",
      "memberSubmission",
      "weeklyReportCycle",
    ]);
  });

  it("deletes all project data in foreign-key-safe order", async () => {
    const fake = createFakeClient();

    await clearProjectData(fake.client, { preserveMembers: false });

    expect(fake.calls.map((call) => call.model)).toEqual([
      "aiRunLog",
      "consolidatedReport",
      "memberSubmission",
      "weeklyReportCycle",
      "member",
      "project",
    ]);
  });

  it("limits deletes to one project when projectId is provided", async () => {
    const fake = createFakeClient();

    await clearProjectData(fake.client, {
      preserveMembers: false,
      projectId: "project-a",
    });

    expect(fake.calls).toEqual([
      {
        args: {
          where: {
            projectId: "project-a",
          },
        },
        model: "aiRunLog",
      },
      {
        args: {
          where: {
            cycle: {
              projectId: "project-a",
            },
          },
        },
        model: "consolidatedReport",
      },
      {
        args: {
          where: {
            cycle: {
              projectId: "project-a",
            },
          },
        },
        model: "memberSubmission",
      },
      {
        args: {
          where: {
            projectId: "project-a",
          },
        },
        model: "weeklyReportCycle",
      },
      {
        args: {
          where: {
            projectId: "project-a",
          },
        },
        model: "member",
      },
      {
        args: {
          where: {
            id: "project-a",
          },
        },
        model: "project",
      },
    ]);
  });
});
