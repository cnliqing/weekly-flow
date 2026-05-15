import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const guideCards = [
  {
    title: "管理员入口",
    description: "配置项目成员、创建周报周期，并在同一处完成汇总和定稿。",
    action: "进入管理后台",
  },
  {
    title: "成员填写入口",
    description: "成员免登录选择姓名，填写本周工作、延期说明和下周计划。",
    action: "填写本周周报",
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
            面向项目团队的轻量周报工作台。管理员维护成员与周期，成员快速提交周报，后续将接入汇总、历史查看与计划承接检查。
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
              <Button
                aria-label={card.action}
                className="mt-8 w-fit"
                variant={card.title === "管理员入口" ? "primary" : "secondary"}
              >
                {card.action}
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
