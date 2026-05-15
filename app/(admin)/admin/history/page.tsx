import { Card } from "@/components/ui/card";

export default function AdminHistoryPage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm font-semibold text-accent">历史归档</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal">历史</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          已关闭或归档周报的查看入口会在后续任务接入。
        </p>
      </div>

      <Card>
        <h3 className="text-xl font-semibold">待接入</h3>
        <p className="mt-3 text-sm leading-7 text-ink-700">
          这里预留给历史周报检索、最终稿查看和归档状态筛选。
        </p>
      </Card>
    </section>
  );
}
