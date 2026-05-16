import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FinalReportEditor } from "@/components/reports/final-report-editor";
import { prisma } from "@/lib/prisma";
import { normalizeStructuredContent, type SubmissionStructuredContent } from "@/lib/submission";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    cycleId: string;
  }>;
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function AdminCycleDetailPage({ params }: PageProps) {
  const { cycleId } = await params;
  const cycle = await prisma.weeklyReportCycle.findUnique({
    where: {
      id: cycleId,
    },
    include: {
      project: {
        include: {
          members: {
            where: {
              isActive: true,
            },
            orderBy: [
              {
                role: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
          },
        },
      },
      submissions: {
        include: {
          member: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
      consolidatedReport: true,
    },
  });

  if (!cycle) {
    notFound();
  }

  const submissionsByMember = new Map(
    cycle.submissions.map((submission) => [submission.memberId, submission]),
  );

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <Link className="text-sm font-semibold text-accent" href="/admin/cycles">
          返回周报周期
        </Link>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal">{cycle.title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          {cycle.project.name} · {formatDate(cycle.weekStartDate)} 至{" "}
          {formatDate(cycle.weekEndDate)} · 下周计划区间{" "}
          {formatDate(cycle.nextWeekStartDate)} 至{" "}
          {formatDate(cycle.nextWeekEndDate)}
        </p>
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold">成员提交状态</h3>
          <span className="text-sm text-ink-500">
            {cycle.submissions.length} / {cycle.project.members.length} 已提交
          </span>
        </div>

        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-paper text-ink-700">
              <tr>
                <th className="px-4 py-3 font-semibold">成员</th>
                <th className="px-4 py-3 font-semibold">状态</th>
                <th className="px-4 py-3 font-semibold">最近提交</th>
                <th className="px-4 py-3 font-semibold">填写链接</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {cycle.project.members.map((member) => {
                const submission = submissionsByMember.get(member.id);

                return (
                  <tr key={member.id}>
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {member.name}
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {submission ? "已提交" : "未提交"}
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {submission
                        ? submission.submittedAt.toLocaleString("zh-CN", {
                            hour12: false,
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-accent hover:underline"
                        href={`/w/${cycle.id}/${member.id}`}
                      >
                        打开填写页
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <FinalReportEditor
          cycleId={cycle.id}
          initialDraftContent={cycle.consolidatedReport?.draftContent}
          initialFinalContent={cycle.consolidatedReport?.finalContent}
          initialPolishedContent={cycle.consolidatedReport?.polishedContent}
          initialStatus={cycle.consolidatedReport?.status ?? "draft"}
        />
      </Card>

      <Card>
        <h3 className="mb-5 text-xl font-semibold">已提交内容</h3>
        <div className="grid gap-4">
          {cycle.submissions.map((submission) => {
            const content = normalizeStructuredContent(
              submission.structuredContent as Partial<SubmissionStructuredContent>,
            );

            return (
              <div
                className="rounded-md border border-line bg-paper/50 p-4"
                key={submission.id}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h4 className="font-semibold">{submission.member.name}</h4>
                  <span className="text-xs text-ink-500">
                    {submission.planCheckSummary ?? "未生成承接检查"}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 text-sm leading-6 text-ink-700 md:grid-cols-2">
                  <ContentBlock items={content.workItems} title="本周工作" />
                  <ContentBlock items={content.delayItems} title="延期说明" />
                  <ContentBlock items={content.problemItems} title="问题解决" />
                  <ContentBlock items={content.nextPlanItems} title="下周计划" />
                </div>
              </div>
            );
          })}
        </div>

        {cycle.submissions.length === 0 ? (
          <p className="text-sm text-ink-700">暂无成员提交。</p>
        ) : null}
      </Card>
    </section>
  );
}

function ContentBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-medium text-ink-900">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-ink-500">未填写</p>
      )}
    </div>
  );
}
