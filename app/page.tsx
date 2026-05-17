import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    include: {
      _count: {
        select: {
          cycles: true,
          members: true,
        },
      },
      cycles: {
        orderBy: {
          weekStartDate: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AppShell>
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-accent">项目门户</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-normal text-ink-900 md:text-5xl">
              项目
            </h2>
            <p className="mt-5 text-base leading-8 text-ink-700">
              选择一个项目后维护团队成员、周报周期、成员提交和历史定稿。不同项目的数据会在项目上下文内隔离。
            </p>
          </div>

          <Link
            className="inline-flex h-11 w-fit items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-[#176447]"
            href="/projects/new"
          >
            创建项目
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => {
            const latestCycle = project.cycles[0];

            return (
              <Card className="flex min-h-64 flex-col justify-between" key={project.id}>
                <div>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-ink-900">
                        {project.name}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-ink-700">
                        {project.description || "暂无项目说明。"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2 text-xs font-semibold text-ink-600">
                      <span className="rounded-md border border-line px-2.5 py-1.5">
                        成员 {project._count.members}
                      </span>
                      <span className="rounded-md border border-line px-2.5 py-1.5">
                        周报 {project._count.cycles}
                      </span>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-ink-700">
                    最近周报：
                    {latestCycle
                      ? `${latestCycle.title} · ${formatDate(latestCycle.weekStartDate)}`
                      : "暂未创建周报周期"}
                  </p>
                </div>

                <Link
                  className="mt-8 inline-flex h-10 w-fit items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-[#176447]"
                  href={`/projects/${project.id}`}
                >
                  进入项目
                </Link>
              </Card>
            );
          })}
        </div>

        {projects.length === 0 ? (
          <Card>
            <p className="text-sm leading-7 text-ink-700">
              暂无项目。先创建项目并配置团队成员后，再开始维护周报。
            </p>
          </Card>
        ) : null}
      </section>
    </AppShell>
  );
}
