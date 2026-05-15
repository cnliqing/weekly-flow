import { Card } from "@/components/ui/card";

export default function AdminCyclesPage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm font-semibold text-accent">周报管理</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal">周报</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          周报周期创建、提交统计与汇总入口会在后续任务接入。
        </p>
      </div>

      <Card>
        <h3 className="text-xl font-semibold">待接入</h3>
        <p className="mt-3 text-sm leading-7 text-ink-700">
          这里预留给周报周期管理、成员提交状态和汇总操作。
        </p>
      </Card>
    </section>
  );
}
