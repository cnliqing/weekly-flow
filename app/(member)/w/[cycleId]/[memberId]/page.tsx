import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportEditor } from "@/components/reports/report-editor";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { type PlanCheckResult } from "@/lib/plan-check";
import { normalizeStructuredContent, type SubmissionStructuredContent } from "@/lib/submission";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    cycleId: string;
    memberId: string;
  }>;
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function MemberWeeklyReportPage({ params }: PageProps) {
  const { cycleId, memberId } = await params;
  const [cycle, member, submission] = await Promise.all([
    prisma.weeklyReportCycle.findUnique({
      where: {
        id: cycleId,
      },
      include: {
        project: true,
      },
    }),
    prisma.member.findUnique({
      where: {
        id: memberId,
      },
    }),
    prisma.memberSubmission.findUnique({
      where: {
        cycleId_memberId: {
          cycleId,
          memberId,
        },
      },
    }),
  ]);

  if (
    !cycle ||
    !member ||
    member.projectId !== cycle.projectId ||
    !member.isActive ||
    member.role !== "member"
  ) {
    notFound();
  }

  const initialContent = submission
    ? normalizeStructuredContent(
        submission.structuredContent as Partial<SubmissionStructuredContent>,
      )
    : null;
  const initialPlanCheck =
    submission?.planCheckWarnings &&
    typeof submission.planCheckWarnings === "object" &&
    "summary" in submission.planCheckWarnings
      ? (submission.planCheckWarnings as PlanCheckResult)
      : null;

  return (
    <main className="min-h-screen bg-paper px-5 py-8 text-ink-900 md:px-10">
      <section className="mx-auto grid max-w-4xl gap-6">
        <div>
          <Link className="text-sm font-semibold text-accent" href={`/w/${cycle.id}`}>
            返回选择姓名
          </Link>
          <p className="mt-5 text-sm font-semibold text-accent">成员周报填写</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">
            {member.name} · {cycle.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-ink-700">
            {cycle.project.name} · 本周 {formatDate(cycle.weekStartDate)} 至{" "}
            {formatDate(cycle.weekEndDate)} · 下周计划{" "}
            {formatDate(cycle.nextWeekStartDate)} 至{" "}
            {formatDate(cycle.nextWeekEndDate)}
          </p>
        </div>

        <Card>
          <ReportEditor
            cycleId={cycle.id}
            initialContent={initialContent}
            initialFreeText={submission?.freeTextContent}
            initialPlanCheck={initialPlanCheck}
            memberId={member.id}
          />
        </Card>
      </section>
    </main>
  );
}
