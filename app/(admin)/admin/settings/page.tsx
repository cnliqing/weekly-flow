import { revalidatePath } from "next/cache";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Card } from "@/components/ui/card";
import { getActionErrorMessage, redirectWithFeedback } from "@/lib/action-feedback";
import { prisma } from "@/lib/prisma";
import { clearProjectData } from "@/lib/system-maintenance";

export const dynamic = "force-dynamic";

const futureSettings = [
  {
    title: "项目周报目标",
    description: "用于统一约束周报产出方向、重点口径和复盘目标。",
  },
  {
    title: "AI 承接提示词",
    description: "用于检查本周工作是否承接上周计划。",
  },
  {
    title: "AI 润色提示词",
    description: "用于控制最终周报的语言风格和表达质量。",
  },
  {
    title: "AI 汇总提示词",
    description: "用于控制成员提交内容的合并、归纳和结构化输出。",
  },
];

function revalidateProjectViews() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/members");
  revalidatePath("/admin/cycles");
  revalidatePath("/admin/history");
  revalidatePath("/admin/settings");
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

async function clearActivityData() {
  "use server";

  let type: "success" | "error" = "success";
  let message = "已清空项目过程数据。";

  try {
    const result = await clearProjectData(prisma, { preserveMembers: true });
    revalidateProjectViews();
    message = `已清空项目过程数据，保留项目和团队成员信息。删除内容：${formatClearResult(result)}。`;
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "清空项目过程数据失败");
  }

  redirectWithFeedback("/admin/settings", type, message);
}

async function clearAllProjectData() {
  "use server";

  let type: "success" | "error" = "success";
  let message = "已清空全部项目数据。";

  try {
    const result = await clearProjectData(prisma, { preserveMembers: false });
    revalidateProjectViews();
    message = `已清空全部项目数据。删除内容：${formatClearResult(result)}。`;
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "清空全部项目数据失败");
  }

  redirectWithFeedback("/admin/settings", type, message);
}

export default function AdminSettingsPage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm font-semibold text-accent">系统设置</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal">数据维护</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          这里用于维护系统级数据和后续项目配置。清空操作会立即影响工作台、填写入口和历史记录。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-5 border-red-200">
          <div>
            <h3 className="text-xl font-semibold text-ink-900">
              清空项目过程数据
            </h3>
            <p className="mt-3 text-sm leading-7 text-ink-700">
              删除 AI 运行记录、汇总报告、成员提交和周报周期，保留项目与团队成员信息。
            </p>
          </div>

          <form action={clearActivityData}>
            <ConfirmSubmitButton
              className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50"
              confirmMessage="确认清空项目过程数据？项目和团队成员会保留，但周报周期、提交、汇总和 AI 记录会被删除。"
              type="submit"
            >
              清空，保留团队成员信息
            </ConfirmSubmitButton>
          </form>
        </Card>

        <Card className="flex flex-col gap-5 border-red-300 bg-red-50/40">
          <div>
            <h3 className="text-xl font-semibold text-red-800">
              清空全部项目数据
            </h3>
            <p className="mt-3 text-sm leading-7 text-red-900/80">
              删除项目、团队成员、周报周期、成员提交、汇总报告和 AI 运行记录。执行后需要重新创建项目和成员。
            </p>
          </div>

          <form action={clearAllProjectData}>
            <ConfirmSubmitButton
              className="inline-flex h-10 items-center justify-center rounded-md bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
              confirmMessage="确认删除全部项目数据？项目、团队成员和所有周报历史都会被删除，此操作不可撤销。"
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
            这些配置入口先在页面中占位，后续会接入可编辑保存能力。
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
