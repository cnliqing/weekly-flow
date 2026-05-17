import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function MemberEntryIndexPage() {
  const cycles = await prisma.weeklyReportCycle.findMany({
    where: {
      status: "open",
    },
    include: {
      project: true,
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: {
      weekStartDate: "desc",
    },
    take: 20,
  });
  const projectGroups = Array.from(
    cycles
      .reduce((groups, cycle) => {
        const group = groups.get(cycle.projectId) ?? {
          projectName: cycle.project.name,
          cycles: [],
        };
        group.cycles.push(cycle);
        groups.set(cycle.projectId, group);
        return groups;
      }, new Map<string, { projectName: string; cycles: typeof cycles }>())
      .values(),
  );

  return (
    <AppShell>
      <section className="mx-auto grid max-w-4xl gap-6">
        <div>
          <Link className="cursor-pointer text-sm font-semibold text-accent" href="/">
            返回上一级
          </Link>
          <p className="mt-5 text-sm font-semibold text-accent">成员填写入口</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">
            选择本周周报
          </h1>
          <p className="mt-4 text-sm leading-7 text-ink-700">
            选择当前开放的周报周期，再从项目固定成员名单中选择自己的姓名进行填写。
          </p>
        </div>

        <div className="grid gap-6">
          {projectGroups.map((group) => (
            <section className="grid gap-3" key={group.projectName}>
              <h2 className="text-xl font-semibold text-ink-900">
                {group.projectName}
              </h2>
              <div className="grid gap-4">
                {group.cycles.map((cycle) => (
                  <Card key={cycle.id}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{cycle.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-ink-700">
                          {formatDate(cycle.weekStartDate)} 至{" "}
                          {formatDate(cycle.weekEndDate)} · 已提交{" "}
                          {cycle._count.submissions} 份
                        </p>
                      </div>
                      <Link
                        className="inline-flex h-10 w-fit items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-[#176447]"
                        href={`/w/${cycle.id}`}
                      >
                        选择姓名
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        {cycles.length === 0 ? (
          <Card>
            <p className="text-sm leading-7 text-ink-700">
              暂无开放中的周报周期。请在工作台中创建本周周报。
            </p>
          </Card>
        ) : null}
      </section>
    </AppShell>
  );
}
