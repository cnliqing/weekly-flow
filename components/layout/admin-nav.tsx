"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
  { label: "工作台", href: "/admin" },
  { label: "项目", href: "/admin/projects" },
  { label: "成员", href: "/admin/members" },
  { label: "周报", href: "/admin/cycles" },
  { label: "历史", href: "/admin/history" },
  { label: "设置", href: "/admin/settings" },
  { label: "填写", href: "/w" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="后台导航" className="flex flex-wrap gap-2 md:flex-col">
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin"
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
