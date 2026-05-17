import { Card } from "@/components/ui/card";
import { getActionErrorMessage, redirectWithFeedback } from "@/lib/action-feedback";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function updateProject(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "项目信息已保存。";

  try {
    const projectId = String(formData.get("projectId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!projectId || !name) {
      throw new Error("项目名称不能为空。");
    }

    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        name,
        description: description || null,
      },
    });

    revalidatePath("/admin/projects");
    revalidatePath("/admin");
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "保存项目信息失败");
  }

  redirectWithFeedback("/admin/projects", type, message);
}

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
          当前版本以单项目为核心，可维护项目名称和说明；成员、周报周期和历史记录都会归属到这个项目。
        </p>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <form action={updateProject} className="grid gap-5">
              <input name="projectId" type="hidden" value={project.id} />
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="grid flex-1 gap-4">
                  <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
                    项目名称
                    <input
                      className="h-11 rounded-md border border-line bg-white px-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      defaultValue={project.name}
                      name="name"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
                    项目说明
                    <textarea
                      className="min-h-24 rounded-md border border-line bg-white px-3 py-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      defaultValue={project.description ?? ""}
                      name="description"
                      placeholder="补充项目背景、范围或周报说明"
                    />
                  </label>
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
              <button
                className="h-11 w-fit rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-[#176447]"
                type="submit"
              >
                保存项目信息
              </button>
            </form>
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
