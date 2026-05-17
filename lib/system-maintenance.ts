import type { Prisma } from "@prisma/client";

type DeleteManyModel<TArgs> = {
  deleteMany: (args?: TArgs) => Promise<{ count: number }>;
};

export type ProjectDataClient = {
  aiRunLog: DeleteManyModel<Prisma.AiRunLogDeleteManyArgs>;
  consolidatedReport: DeleteManyModel<Prisma.ConsolidatedReportDeleteManyArgs>;
  member: DeleteManyModel<Prisma.MemberDeleteManyArgs>;
  memberSubmission: DeleteManyModel<Prisma.MemberSubmissionDeleteManyArgs>;
  project: DeleteManyModel<Prisma.ProjectDeleteManyArgs>;
  weeklyReportCycle: DeleteManyModel<Prisma.WeeklyReportCycleDeleteManyArgs>;
  $transaction: <T>(callback: (tx: ProjectDataTransaction) => Promise<T>) => Promise<T>;
};

export type ProjectDataTransaction = Omit<ProjectDataClient, "$transaction">;

export type ClearProjectDataOptions = {
  preserveMembers: boolean;
  projectId?: string;
};

export type ClearProjectDataResult = {
  aiRunLogs: number;
  consolidatedReports: number;
  memberSubmissions: number;
  weeklyReportCycles: number;
  members: number;
  projects: number;
};

export type DeleteProjectCycleDataInput = {
  cycleId: string;
  projectId: string;
};

export async function clearProjectData(
  client: ProjectDataClient,
  options: ClearProjectDataOptions,
): Promise<ClearProjectDataResult> {
  return client.$transaction(async (tx) => {
    const projectFilter = options.projectId
      ? {
          where: {
            projectId: options.projectId,
          },
        }
      : undefined;
    const cycleProjectFilter = options.projectId
      ? {
          where: {
            cycle: {
              projectId: options.projectId,
            },
          },
        }
      : undefined;
    const aiRunLogs = await tx.aiRunLog.deleteMany(projectFilter);
    const consolidatedReports =
      await tx.consolidatedReport.deleteMany(cycleProjectFilter);
    const memberSubmissions =
      await tx.memberSubmission.deleteMany(cycleProjectFilter);
    const weeklyReportCycles = await tx.weeklyReportCycle.deleteMany(projectFilter);

    if (options.preserveMembers) {
      return {
        aiRunLogs: aiRunLogs.count,
        consolidatedReports: consolidatedReports.count,
        memberSubmissions: memberSubmissions.count,
        weeklyReportCycles: weeklyReportCycles.count,
        members: 0,
        projects: 0,
      };
    }

    const members = await tx.member.deleteMany(projectFilter);
    const projects = await tx.project.deleteMany(
      options.projectId
        ? {
            where: {
              id: options.projectId,
            },
          }
        : undefined,
    );

    return {
      aiRunLogs: aiRunLogs.count,
      consolidatedReports: consolidatedReports.count,
      memberSubmissions: memberSubmissions.count,
      weeklyReportCycles: weeklyReportCycles.count,
      members: members.count,
      projects: projects.count,
    };
  });
}

export async function deleteProjectCycleData(
  client: ProjectDataClient,
  input: DeleteProjectCycleDataInput,
): Promise<ClearProjectDataResult> {
  return client.$transaction(async (tx) => {
    const aiRunLogs = await tx.aiRunLog.deleteMany({
      where: {
        cycleId: input.cycleId,
        projectId: input.projectId,
      },
    });
    const consolidatedReports = await tx.consolidatedReport.deleteMany({
      where: {
        cycleId: input.cycleId,
        cycle: {
          projectId: input.projectId,
        },
      },
    });
    const memberSubmissions = await tx.memberSubmission.deleteMany({
      where: {
        cycleId: input.cycleId,
        cycle: {
          projectId: input.projectId,
        },
      },
    });
    const weeklyReportCycles = await tx.weeklyReportCycle.deleteMany({
      where: {
        id: input.cycleId,
        projectId: input.projectId,
      },
    });

    return {
      aiRunLogs: aiRunLogs.count,
      consolidatedReports: consolidatedReports.count,
      memberSubmissions: memberSubmissions.count,
      members: 0,
      projects: 0,
      weeklyReportCycles: weeklyReportCycles.count,
    };
  });
}
