import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getActionErrorMessage, redirectWithFeedback } from "@/lib/action-feedback";
import { getAdminSession } from "@/lib/auth";
import { createCurrentWeekCycle as createCycle, getDefaultProject } from "@/lib/cycles";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function createCurrentWeekCycle(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "本周周报已创建。";

  try {
    const session = await getAdminSession();

    if (!session) {
      throw new Error("未登录或无管理员权限。");
    }

    const project = await getDefaultProject();

    if (!project) {
      throw new Error("默认项目不存在，请先创建项目或执行初始化数据。");
    }

    const reportDateValue = String(formData.get("reportDate") ?? "").trim();
    const reportDate = parseInputDate(reportDateValue);
    const result = await createCycle(project.id, reportDate);
    revalidatePath("/admin/cycles");
    message = result.created
      ? "周报已创建。"
      : "该日期所在周的周报已存在，已更新为开放状态。";
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "创建本周周报失败");
  }

  redirectWithFeedback("/admin/cycles", type, message);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getTodayInputDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : formatDate(new Date());
}

function parseInputDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("请选择有效日期。");
  }

  const date = new Date(`${value}T00:00:00+08:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("请选择有效日期。");
  }

  return date;
}

export default async function AdminCyclesPage() {
  const cycles = await prisma.weeklyReportCycle.findMany({
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

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">周报管理</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal">周报周期</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
            创建本周周报，查看每个周期的成员填写状态和免登录填写链接。
          </p>
        </div>

        <form
          action={createCurrentWeekCycle}
          className="flex flex-col gap-3 rounded-md border border-line bg-white p-4 md:min-w-80"
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
            周报日期
            <input
              className="h-11 rounded-md border border-line bg-white px-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              defaultValue={getTodayInputDate()}
              name="reportDate"
              required
              type="date"
            />
          </label>
          <button
            className="h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-[#176447]"
            type="submit"
          >
            创建指定周周报
          </button>
        </form>
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold">最近周期</h3>
          <span className="text-sm text-ink-500">共 {cycles.length} 个</span>
        </div>

        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-paper text-ink-700">
              <tr>
                <th className="px-4 py-3 font-semibold">标题</th>
                <th className="px-4 py-3 font-semibold">项目</th>
                <th className="px-4 py-3 font-semibold">周期</th>
                <th className="px-4 py-3 font-semibold">状态</th>
                <th className="px-4 py-3 font-semibold">提交</th>
                <th className="px-4 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {cycles.map((cycle) => (
                <tr key={cycle.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {cycle.title}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{cycle.project.name}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {formatDate(cycle.weekStartDate)} 至 {formatDate(cycle.weekEndDate)}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{cycle.status}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {cycle._count.submissions} 份
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      className="font-semibold text-accent hover:underline"
                      href={`/admin/cycles/${cycle.id}`}
                    >
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cycles.length === 0 ? (
          <p className="mt-4 text-sm text-ink-700">
            暂无周报周期。点击“创建本周周报”会为默认项目“周报通”创建或复用当前周周期。
          </p>
        ) : null}
      </Card>
    </section>
  );
}
