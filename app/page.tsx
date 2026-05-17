import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import Link from "next/link";

const guideCards = [
  {
    title: "团队工作台",
    description: "配置项目成员、创建周报周期，并在同一处完成汇总和定稿。",
    action: "进入工作台",
    href: "/admin",
  },
  {
    title: "成员填写入口",
    description: "成员免登录选择姓名，填写本周工作、延期说明和下周计划。",
    action: "填写本周周报",
    href: "/w",
  },
];

export default function HomePage() {
  return (
    <AppShell>
      <section className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-accent">单项目周报系统</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-normal text-ink-900 md:text-5xl">
            周报通 / WeeklyFlow
          </h2>
          <p className="mt-5 text-base leading-8 text-ink-700">
            面向项目团队的轻量周报工作台。团队可直接维护成员与周期，成员快速提交周报，系统辅助检查计划承接并生成汇总草稿。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {guideCards.map((card) => (
            <Card className="flex min-h-56 flex-col justify-between" key={card.title}>
              <div>
                <h3 className="text-xl font-semibold text-ink-900">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-700">
                  {card.description}
                </p>
              </div>
              <Link
                aria-label={card.action}
                className={
                  card.title === "团队工作台"
                    ? "mt-8 inline-flex h-10 w-fit items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-[#176447]"
                    : "mt-8 inline-flex h-10 w-fit items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink-900 transition hover:border-ink-500"
                }
                href={card.href}
              >
                {card.action}
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
