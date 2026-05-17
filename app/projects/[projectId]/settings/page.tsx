import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Card } from "@/components/ui/card";
import { getActionErrorMessage, redirectWithFeedback } from "@/lib/action-feedback";
import { prisma } from "@/lib/prisma";
import { clearProjectData } from "@/lib/system-maintenance";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

const futureSettings = [
  {
    title: "项目周报目标",
    description: "用于统一约束当前项目周报产出方向、重点口径和复盘目标。",
  },
  {
    title: "AI 承接提示词",
    description: "用于检查本周工作是否承接当前项目的上周计划。",
  },
  {
    title: "AI 润色提示词",
    description: "用于控制当前项目最终周报的语言风格和表达质量。",
  },
  {
    title: "AI 汇总提示词",
    description: "用于控制当前项目成员提交内容的合并、归纳和结构化输出。",
  },
];

function revalidateProjectViews(projectId: string) {
  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/members`);
  revalidatePath(`/projects/${projectId}/cycles`);
  revalidatePath(`/projects/${projectId}/history`);
  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath("/w");
}

function formatClearResult(result: Awaited<ReturnType<typeof clearProjectData>>) {
  return [
    `AI 记录 ${result.aiRunLogs} 条`,
    `汇总报告 ${result.consolidatedReports} 份`,
    `成员提交 ${result.memberSubmissions} 份`,
    `周报周期 ${result.weeklyReportCycles} 个`,
    `成员 ${result.members} 人`,
    `项目 ${result.projects} 个`,
  ].join("，");
}

async function clearActivityData(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "已清空当前项目过程数据。";
  const projectId = String(formData.get("projectId") ?? "").trim();

  try {
    if (!projectId) {
      throw new Error("缺少项目 ID。");
    }

    const result = await clearProjectData(prisma, {
      preserveMembers: true,
      projectId,
    });
    revalidateProjectViews(projectId);
    message = `已清空当前项目过程数据，保留项目和团队成员信息。删除内容：${formatClearResult(result)}。`;
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "清空当前项目过程数据失败");
  }

  redirectWithFeedback(`/projects/${projectId}/settings`, type, message);
}

async function clearCurrentProjectData(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "已清空当前项目全部数据。";
  const projectId = String(formData.get("projectId") ?? "").trim();

  try {
    if (!projectId) {
      throw new Error("缺少项目 ID。");
    }

    const result = await clearProjectData(prisma, {
      preserveMembers: false,
      projectId,
    });
    revalidateProjectViews(projectId);
    message = `已清空当前项目全部数据。删除内容：${formatClearResult(result)}。`;
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "清空当前项目全部数据失败");
    redirectWithFeedback(`/projects/${projectId}/settings`, type, message);
  }

  redirect(`/?feedbackType=${type}&feedbackMessage=${encodeURIComponent(message)}`);
}

export default async function ProjectSettingsPage({ params }: PageProps) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm font-semibold text-accent">项目设置</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal">数据维护</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          当前项目：{project.name}。这里的清空操作只影响当前项目。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-5 border-red-200">
          <div>
            <h3 className="text-xl font-semibold text-ink-900">
              清空当前项目过程数据
            </h3>
            <p className="mt-3 text-sm leading-7 text-ink-700">
              删除当前项目的 AI 运行记录、汇总报告、成员提交和周报周期，保留项目与团队成员信息。
            </p>
          </div>

          <form action={clearActivityData}>
            <input name="projectId" type="hidden" value={project.id} />
            <ConfirmSubmitButton
              className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50"
              confirmMessage="确认清空当前项目过程数据？项目和团队成员会保留，但周报周期、提交、汇总和 AI 记录会被删除。"
              type="submit"
            >
              清空，保留团队成员信息
            </ConfirmSubmitButton>
          </form>
        </Card>

        <Card className="flex flex-col gap-5 border-red-300 bg-red-50/40">
          <div>
            <h3 className="text-xl font-semibold text-red-800">
              清空当前项目全部数据
            </h3>
            <p className="mt-3 text-sm leading-7 text-red-900/80">
              删除当前项目、团队成员、周报周期、成员提交、汇总报告和 AI 运行记录。其他项目不受影响。
            </p>
          </div>

          <form action={clearCurrentProjectData}>
            <input name="projectId" type="hidden" value={project.id} />
            <ConfirmSubmitButton
              className="inline-flex h-10 items-center justify-center rounded-md bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
              confirmMessage="确认删除当前项目全部数据？当前项目、团队成员和所有周报历史都会被删除，此操作不可撤销。"
              type="submit"
            >
              清空，不保留全部删除
            </ConfirmSubmitButton>
          </form>
        </Card>
      </div>

      <section className="grid gap-4">
        <div>
          <h3 className="text-xl font-semibold text-ink-900">后续配置项</h3>
          <p className="mt-2 text-sm leading-7 text-ink-700">
            这些配置入口先在页面中占位，后续会接入当前项目范围内的可编辑保存能力。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {futureSettings.map((item) => (
            <Card className="bg-white/70" key={item.title}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-ink-900">{item.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-ink-700">
                    {item.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink-500">
                  待配置
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </section>
  );
}
