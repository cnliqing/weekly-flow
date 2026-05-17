import Link from "next/link";
import { Card } from "@/components/ui/card";

const adminEntrances = [
  {
    title: "项目",
    description: "查看当前周报项目，为后续多项目或项目配置扩展预留入口。",
    href: "/admin/projects",
  },
  {
    title: "成员",
    description: "维护项目成员、角色与启用状态，供成员填写和汇总流程使用。",
    href: "/admin/members",
  },
  {
    title: "周报",
    description: "创建与管理每周周报周期，后续会接入提交统计与汇总操作。",
    href: "/admin/cycles",
  },
  {
    title: "历史",
    description: "查看已归档周报和最终版本，沉淀团队阶段性产出。",
    href: "/admin/history",
  },
  {
    title: "设置",
    description: "维护项目数据，后续集中配置周报目标和 AI 提示词。",
    href: "/admin/settings",
  },
];

export default function AdminPage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm font-semibold text-accent">管理后台</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal md:text-4xl">
          周报通 / WeeklyFlow
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          这里是团队工作台。系统采用开放访问模式，任何访问者都可以维护项目、成员、周报周期、汇总定稿和历史记录。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {adminEntrances.map((item) => (
          <Link href={item.href} key={item.href}>
            <Card className="min-h-44 transition hover:-translate-y-0.5 hover:border-accent">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink-700">
                {item.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
