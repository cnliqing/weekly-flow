import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      _count: {
        select: {
          cycles: true,
          members: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm font-semibold text-accent">项目配置</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal">项目</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          当前版本以单项目为核心，项目数据来自 Prisma。后续任务可在这里继续接入创建和编辑能力。
        </p>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-xl font-semibold">{project.name}</h3>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  {project.description ?? "暂无项目说明"}
                </p>
              </div>
              <div className="flex gap-3 text-sm text-ink-700">
                <span className="rounded-md border border-line px-3 py-2">
                  成员 {project._count.members}
                </span>
                <span className="rounded-md border border-line px-3 py-2">
                  周期 {project._count.cycles}
                </span>
              </div>
            </div>
          </Card>
        ))}

        {projects.length === 0 ? (
          <Card>
            <p className="text-sm text-ink-700">
              暂无项目数据。请先运行 `npm run db:seed` 写入默认项目。
            </p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
