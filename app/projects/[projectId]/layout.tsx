import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectNav } from "@/components/layout/project-nav";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type LayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    projectId: string;
  }>;
}>;

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-paper text-ink-900 md:flex">
      <aside className="flex w-full flex-col gap-8 border-b border-line bg-white/70 px-6 py-6 md:sticky md:top-0 md:h-screen md:w-72 md:overflow-y-auto md:border-b-0 md:border-r">
        <div>
          <p className="text-sm font-semibold text-accent">WeeklyFlow</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">
            {project.name}
          </h1>
        </div>

        <ProjectNav projectId={project.id} />

        <Link
          className="mt-auto rounded-md border border-line px-3 py-2 text-center text-sm font-semibold text-ink-700 transition hover:border-ink-500 hover:text-ink-900"
          href="/"
        >
          返回项目列表
        </Link>
      </aside>

      <main className="flex-1 px-5 py-8 md:px-10 lg:px-14">
        <FeedbackToast />
        {children}
      </main>
    </div>
  );
}
