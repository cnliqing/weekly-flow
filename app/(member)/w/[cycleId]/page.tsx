import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    cycleId: string;
  }>;
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function MemberSelectPage({ params }: PageProps) {
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
              role: "member",
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!cycle) {
    notFound();
  }

  return (
    <AppShell>
      <section className="mx-auto grid max-w-4xl gap-6">
        <div>
          <Link className="cursor-pointer text-sm font-semibold text-accent" href="/w">
            返回周报入口
          </Link>
          <p className="mt-5 text-sm font-semibold text-accent">成员填写入口</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">
            选择你的姓名
          </h1>
          <p className="mt-4 text-sm leading-7 text-ink-700">
            {cycle.project.name} · {cycle.title} · {formatDate(cycle.weekStartDate)} 至{" "}
            {formatDate(cycle.weekEndDate)}
          </p>
        </div>

        <Card>
          <div className="grid gap-3 md:grid-cols-2">
            {cycle.project.members.map((member) => (
              <Link
                className="rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold text-ink-900 transition hover:border-accent hover:text-accent"
                href={`/w/${cycle.id}/${member.id}`}
                key={member.id}
              >
                {member.name}
              </Link>
            ))}
          </div>

          {cycle.project.members.length === 0 ? (
            <p className="text-sm leading-7 text-ink-700">
              当前项目暂无启用成员，请在工作台中维护项目人员。
            </p>
          ) : null}
        </Card>
      </section>
    </AppShell>
  );
}
