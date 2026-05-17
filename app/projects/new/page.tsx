import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectMemberRows } from "@/components/forms/project-member-rows";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { getActionErrorMessage, redirectWithFeedback } from "@/lib/action-feedback";
import { normalizeMemberRole } from "@/lib/member-role";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function createProject(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "项目已创建。";
  let projectId = "";

  try {
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const memberNames = formData
      .getAll("memberName")
      .map((value) => String(value).trim());
    const memberRoles = formData.getAll("memberRole");

    if (!name) {
      throw new Error("项目名称不能为空。");
    }

    const members = memberNames
      .map((memberName, index) => ({
        name: memberName,
        role: normalizeMemberRole(memberRoles[index]),
      }))
      .filter((member) => member.name);
    const uniqueMembers = Array.from(
      new Map(members.map((member) => [member.name, member])).values(),
    );

    if (uniqueMembers.length === 0) {
      throw new Error("请至少添加一名团队成员。");
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        members: {
          create: uniqueMembers.map((member) => ({
            name: member.name,
            role: member.role,
            isActive: true,
          })),
        },
      },
    });

    projectId = project.id;
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "创建项目失败");
  }

  if (projectId) {
    redirect(`/projects/${projectId}`);
  }

  redirectWithFeedback("/projects/new", type, message);
}

export default function NewProjectPage() {
  return (
    <AppShell>
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <div>
          <Link className="text-sm font-semibold text-accent" href="/">
            返回项目列表
          </Link>
          <p className="mt-5 text-sm font-semibold text-accent">创建项目</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">
            新项目
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
            创建项目时同步录入团队成员和角色。角色只包含项目经理和开发。
          </p>
        </div>

        <Card>
          <form action={createProject} className="grid gap-7">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
                项目名称
                <input
                  className="h-11 rounded-md border border-line bg-white px-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  name="name"
                  placeholder="例如：支付平台重构"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-ink-700 md:col-span-2">
                项目说明
                <textarea
                  className="min-h-24 rounded-md border border-line bg-white px-3 py-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  name="description"
                  placeholder="补充项目背景、范围或周报说明"
                />
              </label>
            </div>

            <ProjectMemberRows />

            <button
              className="h-11 w-fit rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-[#176447]"
              type="submit"
            >
              创建项目
            </button>
          </form>
        </Card>
      </section>
    </AppShell>
  );
}
