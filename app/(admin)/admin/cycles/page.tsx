import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getActionErrorMessage, redirectWithFeedback } from "@/lib/action-feedback";
import { createReportCycleForRange, getDefaultProject } from "@/lib/cycles";
import { formatCycleStatus } from "@/lib/cycle-status";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function createCurrentWeekCycle(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "本周周报已创建。";

  try {
    const project = await getDefaultProject();

    if (!project) {
      throw new Error("默认项目不存在，请先创建项目或执行初始化数据。");
    }

    const startDateValue = String(formData.get("startDate") ?? "").trim();
    const endDateValue = String(formData.get("endDate") ?? "").trim();
    const startDate = parseInputDate(startDateValue, "请选择开始日期。");
    const endDate = parseInputDate(endDateValue, "请选择结束日期。");

    if (endDate < startDate) {
      throw new Error("结束日期不能早于开始日期。");
    }

    const result = await createReportCycleForRange(project.id, startDate, endDate);
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

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date(`${getTodayInputDate()}T00:00:00.000Z`);
  const isoDay = today.getUTCDay() === 0 ? 7 : today.getUTCDay();
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + 1 - isoDay);
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);

  return {
    startDate: formatDate(monday),
    endDate: formatDate(friday),
  };
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

function parseInputDate(value: string, message: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(message);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(message);
  }

  return date;
}

export default async function AdminCyclesPage() {
  const defaultDateRange = getDefaultDateRange();
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
            开始日期
            <input
              className="h-11 rounded-md border border-line bg-white px-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              defaultValue={defaultDateRange.startDate}
              name="startDate"
              required
              type="date"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
            结束日期
            <input
              className="h-11 rounded-md border border-line bg-white px-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              defaultValue={defaultDateRange.endDate}
              name="endDate"
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
                  <td className="px-4 py-3 text-ink-700">
                    {formatCycleStatus(cycle.status)}
                  </td>
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
