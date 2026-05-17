const navItems = [
  { label: "项目列表", href: "/" },
  { label: "新建项目", href: "/projects/new" },
];

export function Sidebar() {
  return (
    <aside className="flex w-full flex-col gap-8 border-b border-line bg-paper/90 px-6 py-6 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
      <div>
        <p className="text-sm font-medium text-accent">WeeklyFlow</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-ink-900">
          周报通
        </h1>
      </div>

      <nav aria-label="主导航" className="flex flex-wrap gap-2 md:flex-col">
        {navItems.map((item) => (
          <a
            className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-white hover:text-ink-900"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
