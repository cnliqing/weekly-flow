type DeleteManyModel = {
  deleteMany: () => Promise<{ count: number }>;
};

export type ProjectDataClient = {
  aiRunLog: DeleteManyModel;
  consolidatedReport: DeleteManyModel;
  member: DeleteManyModel;
  memberSubmission: DeleteManyModel;
  project: DeleteManyModel;
  weeklyReportCycle: DeleteManyModel;
  $transaction: <T>(callback: (tx: ProjectDataTransaction) => Promise<T>) => Promise<T>;
};

export type ProjectDataTransaction = Omit<ProjectDataClient, "$transaction">;

export type ClearProjectDataOptions = {
  preserveMembers: boolean;
};

export type ClearProjectDataResult = {
  aiRunLogs: number;
  consolidatedReports: number;
  memberSubmissions: number;
  weeklyReportCycles: number;
  members: number;
  projects: number;
};

export async function clearProjectData(
  client: ProjectDataClient,
  options: ClearProjectDataOptions,
): Promise<ClearProjectDataResult> {
  return client.$transaction(async (tx) => {
    const aiRunLogs = await tx.aiRunLog.deleteMany();
    const consolidatedReports = await tx.consolidatedReport.deleteMany();
    const memberSubmissions = await tx.memberSubmission.deleteMany();
    const weeklyReportCycles = await tx.weeklyReportCycle.deleteMany();

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

    const members = await tx.member.deleteMany();
    const projects = await tx.project.deleteMany();

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
