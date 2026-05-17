"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

type ProjectNavProps = {
  projectId: string;
};

export function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname();
  const navItems = [
    { label: "工作台", href: `/projects/${projectId}` },
    { label: "成员", href: `/projects/${projectId}/members` },
    { label: "周报", href: `/projects/${projectId}/cycles` },
    { label: "历史", href: `/projects/${projectId}/history` },
    { label: "设置", href: `/projects/${projectId}/settings` },
    { label: "填写", href: "/w" },
  ];

  return (
    <nav aria-label="项目导航" className="flex flex-wrap gap-2 md:flex-col">
      {navItems.map((item) => {
        const isActive =
          item.href === `/projects/${projectId}`
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "rounded-md px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-accent text-white shadow-sm"
                : "text-ink-700 hover:bg-paper hover:text-ink-900",
            )}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
