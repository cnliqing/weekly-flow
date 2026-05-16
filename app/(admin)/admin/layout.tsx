import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";

const navItems = [
  { label: "总览", href: "/admin" },
  { label: "项目", href: "/admin/projects" },
  { label: "成员", href: "/admin/members" },
  { label: "周报", href: "/admin/cycles" },
  { label: "历史", href: "/admin/history" },
  { label: "设置", href: "/admin/settings" },
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="min-h-screen bg-paper text-ink-900 md:flex">
      <aside className="flex w-full flex-col gap-8 border-b border-line bg-white/70 px-6 py-6 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
        <div>
          <p className="text-sm font-semibold text-accent">WeeklyFlow</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">
            周报通
          </h1>
          <p className="mt-3 text-xs leading-5 text-ink-500">
            当前管理员：{session.user.email}
          </p>
        </div>

        <nav aria-label="后台导航" className="flex flex-wrap gap-2 md:flex-col">
          {navItems.map((item) => (
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-paper hover:text-ink-900"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          className="mt-auto rounded-md border border-line px-3 py-2 text-center text-sm font-semibold text-ink-700 transition hover:border-ink-500 hover:text-ink-900"
          href="/"
        >
          返回首页
        </Link>
      </aside>

      <main className="flex-1 px-5 py-8 md:px-10 lg:px-14">{children}</main>
    </div>
  );
}
