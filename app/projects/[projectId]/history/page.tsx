import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { formatHistoryCycleStatus } from "@/lib/history-format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatReportStatus(status?: "draft" | "finalized" | null): string {
  if (status === "finalized") {
    return "已定稿";
  }

  if (status === "draft") {
    return "草稿";
  }

  return "未生成";
}

export default async function ProjectHistoryPage({ params }: PageProps) {
  const { projectId } = await params;
  const [project, cycles] = await Promise.all([
    prisma.project.findUnique({
      where: {
        id: projectId,
      },
    }),
    prisma.weeklyReportCycle.findMany({
      where: {
        projectId,
      },
      include: {
        consolidatedReport: true,
        _count: {
          select: {
            submissions: true,
            aiRuns: true,
          },
        },
      },
      orderBy: {
        weekStartDate: "desc",
      },
      take: 50,
    }),
  ]);

  if (!project) {
    notFound();
  }

  const finalizedCount = cycles.filter(
    (cycle) => cycle.consolidatedReport?.status === "finalized",
  ).length;
  const submissionCount = cycles.reduce(
    (total, cycle) => total + cycle._count.submissions,
    0,
  );

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm font-semibold text-accent">历史归档</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal">历史周报</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          当前项目：{project.name}。这里只展示当前项目的历史周期、定稿和 AI 记录。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-ink-500">历史周期</p>
          <p className="mt-3 text-3xl font-semibold">{cycles.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-500">成员提交</p>
          <p className="mt-3 text-3xl font-semibold">{submissionCount}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-500">已定稿</p>
          <p className="mt-3 text-3xl font-semibold">{finalizedCount}</p>
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold">周期列表</h3>
          <span className="text-sm text-ink-500">最近 {cycles.length} 个周期</span>
        </div>

        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-paper text-ink-700">
              <tr>
                <th className="px-4 py-3 font-semibold">周期</th>
                <th className="px-4 py-3 font-semibold">日期</th>
                <th className="px-4 py-3 font-semibold">状态</th>
                <th className="px-4 py-3 font-semibold">提交</th>
                <th className="px-4 py-3 font-semibold">定稿</th>
                <th className="px-4 py-3 font-semibold">AI 记录</th>
                <th className="px-4 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {cycles.map((cycle) => (
                <tr key={cycle.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {cycle.title}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {formatDate(cycle.weekStartDate)} 至 {formatDate(cycle.weekEndDate)}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {formatHistoryCycleStatus(cycle.status)}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {cycle._count.submissions} 份
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {formatReportStatus(cycle.consolidatedReport?.status)}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {cycle._count.aiRuns} 条
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      className="font-semibold text-accent hover:underline"
                      href={`/projects/${project.id}/history/${cycle.id}`}
                    >
                      查看历史
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cycles.length === 0 ? (
          <p className="mt-4 text-sm text-ink-700">
            当前项目暂无历史周报。创建并汇总周报后，这里会显示可追溯的周期记录。
          </p>
        ) : null}
      </Card>
    </section>
  );
}
