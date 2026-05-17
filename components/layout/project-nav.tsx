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
    { label: "项目概览", href: `/projects/${projectId}` },
    { label: "团队成员", href: `/projects/${projectId}/members` },
    { label: "周报周期", href: `/projects/${projectId}/cycles` },
    { label: "历史周报", href: `/projects/${projectId}/history` },
    { label: "项目设置", href: `/projects/${projectId}/settings` },
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
