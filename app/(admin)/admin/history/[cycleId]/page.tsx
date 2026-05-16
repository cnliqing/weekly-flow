import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  normalizeStructuredContent,
  type SubmissionStructuredContent,
} from "@/lib/submission";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    cycleId: string;
  }>;
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("zh-CN", {
    hour12: false,
  });
}

function formatReportStatus(status?: "draft" | "finalized" | null): string {
  return status === "finalized" ? "已定稿" : "草稿";
}

function previewText(content?: string | null): string {
  const trimmed = content?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : "暂无内容";
}

export default async function AdminHistoryDetailPage({ params }: PageProps) {
  const { cycleId } = await params;
  const cycle = await prisma.weeklyReportCycle.findUnique({
    where: {
      id: cycleId,
    },
    include: {
      project: true,
      submissions: {
        include: {
          member: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
      consolidatedReport: true,
      aiRuns: {
        orderBy: {
          createdAt: "desc",
        },
        take: 30,
      },
    },
  });

  if (!cycle) {
    notFound();
  }

  const report = cycle.consolidatedReport;
  const successfulAiRuns = cycle.aiRuns.filter((run) => run.success).length;

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <Link className="text-sm font-semibold text-accent" href="/admin/history">
          返回历史列表
        </Link>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal">{cycle.title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          {cycle.project.name} · {formatDate(cycle.weekStartDate)} 至{" "}
          {formatDate(cycle.weekEndDate)} · 周期状态 {cycle.status}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-ink-500">提交数</p>
          <p className="mt-3 text-3xl font-semibold">{cycle.submissions.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-500">定稿状态</p>
          <p className="mt-3 text-2xl font-semibold">
            {report ? formatReportStatus(report.status) : "未生成"}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-500">AI 运行</p>
          <p className="mt-3 text-3xl font-semibold">{cycle.aiRuns.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-500">成功运行</p>
          <p className="mt-3 text-3xl font-semibold">{successfulAiRuns}</p>
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold">周报内容</h3>
          <span className="text-sm text-ink-500">
            {report ? `更新于 ${formatDateTime(report.updatedAt)}` : "尚未汇总"}
          </span>
        </div>

        <div className="grid gap-4">
          <ReportBlock content={report?.finalContent} title="最终稿" />
          <ReportBlock content={report?.draftContent} title="汇总草稿" />
          <ReportBlock content={report?.polishedContent} title="润色稿" />
        </div>
      </Card>

      <Card>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold">成员提交摘要</h3>
          <span className="text-sm text-ink-500">
            共 {cycle.submissions.length} 份提交
          </span>
        </div>

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
                  <div>
                    <h4 className="font-semibold">{submission.member.name}</h4>
                    <p className="mt-1 text-xs text-ink-500">
                      提交于 {formatDateTime(submission.submittedAt)}
                    </p>
                  </div>
                  <span className="text-xs text-ink-500">
                    {submission.planCheckSummary ?? "未生成承接检查"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm leading-6 text-ink-700 md:grid-cols-2">
                  <ContentBlock items={content.workItems} title="本周工作" />
                  <ContentBlock items={content.delayItems} title="延期说明" />
                  <ContentBlock items={content.problemItems} title="问题解决" />
                  <ContentBlock items={content.nextPlanItems} title="下周计划" />
                </div>
                {submission.freeTextContent ? (
                  <div className="mt-4 rounded-md border border-line bg-white p-3 text-sm leading-6 text-ink-700">
                    {submission.freeTextContent}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {cycle.submissions.length === 0 ? (
          <p className="text-sm text-ink-700">暂无成员提交。</p>
        ) : null}
      </Card>

      <Card>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold">AI 运行日志</h3>
          <span className="text-sm text-ink-500">最近 {cycle.aiRuns.length} 条</span>
        </div>

        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-paper text-ink-700">
              <tr>
                <th className="px-4 py-3 font-semibold">时间</th>
                <th className="px-4 py-3 font-semibold">类型</th>
                <th className="px-4 py-3 font-semibold">模型</th>
                <th className="px-4 py-3 font-semibold">结果</th>
                <th className="px-4 py-3 font-semibold">错误摘要</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {cycle.aiRuns.map((run) => (
                <tr key={run.id}>
                  <td className="px-4 py-3 text-ink-700">
                    {formatDateTime(run.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{run.type}</td>
                  <td className="px-4 py-3 text-ink-700">{run.model}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {run.success ? "成功" : "失败"}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {run.errorMessage ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cycle.aiRuns.length === 0 ? (
          <p className="mt-4 text-sm text-ink-700">暂无 AI 运行日志。</p>
        ) : null}
      </Card>
    </section>
  );
}

function ReportBlock({ title, content }: { title: string; content?: string | null }) {
  return (
    <section className="rounded-md border border-line bg-paper/50 p-4">
      <h4 className="font-semibold text-ink-900">{title}</h4>
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-ink-700">
        {previewText(content)}
      </pre>
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
