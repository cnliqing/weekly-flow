import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
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

export default async function ProjectDashboardPage({ params }: PageProps) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      _count: {
        select: {
          cycles: true,
          members: true,
        },
      },
      cycles: {
        include: {
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: {
          weekStartDate: "desc",
        },
        take: 1,
      },
    },
  });

  if (!project) {
    notFound();
  }

  const latestCycle = project.cycles[0];
  const quickLinks = [
    {
      title: "成员",
      description: "维护当前项目成员、角色和启用状态。",
      href: `/projects/${project.id}/members`,
    },
    {
      title: "周报",
      description: "创建周报周期，查看提交状态并完成汇总。",
      href: `/projects/${project.id}/cycles`,
    },
    {
      title: "历史",
      description: "查看当前项目历史周期和定稿内容。",
      href: `/projects/${project.id}/history`,
    },
    {
      title: "设置",
      description: "维护当前项目数据和后续配置项。",
      href: `/projects/${project.id}/settings`,
    },
  ];

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm font-semibold text-accent">项目工作台</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal md:text-4xl">
          {project.name}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          {project.description || "暂无项目说明。"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-ink-500">成员</p>
          <p className="mt-3 text-3xl font-semibold">{project._count.members}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-500">周报周期</p>
          <p className="mt-3 text-3xl font-semibold">{project._count.cycles}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-500">最近提交</p>
          <p className="mt-3 text-3xl font-semibold">
            {latestCycle?._count.submissions ?? 0}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="text-xl font-semibold">最近周报</h3>
        {latestCycle ? (
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-7 text-ink-700">
              {latestCycle.title} · {formatDate(latestCycle.weekStartDate)} 至{" "}
              {formatDate(latestCycle.weekEndDate)} · 已提交{" "}
              {latestCycle._count.submissions} 份
            </p>
            <Link
              className="inline-flex h-10 w-fit items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-[#176447]"
              href={`/projects/${project.id}/cycles/${latestCycle.id}`}
            >
              查看周报
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-7 text-ink-700">
            当前项目还没有周报周期。
          </p>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => (
          <Link href={link.href} key={link.href}>
            <Card className="min-h-40 transition hover:-translate-y-0.5 hover:border-accent">
              <h3 className="text-xl font-semibold">{link.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink-700">
                {link.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
