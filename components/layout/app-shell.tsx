import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink-900 md:flex">
      <Sidebar />
      <main className="flex-1 px-5 py-8 md:px-10 lg:px-14">{children}</main>
    </div>
  );
}
