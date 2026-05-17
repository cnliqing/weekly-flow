import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Card } from "@/components/ui/card";
import { getActionErrorMessage, redirectWithFeedback } from "@/lib/action-feedback";
import {
  memberRoleOptions,
  normalizeMemberRole,
} from "@/lib/member-role";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function revalidateMemberViews(projectId: string) {
  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/members`);
  revalidatePath(`/projects/${projectId}/cycles`);
  revalidatePath("/w");
}

async function addMember(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "成员已添加或重新启用。";
  const projectId = String(formData.get("projectId") ?? "").trim();

  try {
    const name = String(formData.get("name") ?? "").trim();
    const role = normalizeMemberRole(formData.get("role"));

    if (!projectId || !name) {
      throw new Error("缺少项目或成员姓名。");
    }

    await prisma.member.upsert({
      where: {
        projectId_name: {
          projectId,
          name,
        },
      },
      update: {
        isActive: true,
        role,
      },
      create: {
        projectId,
        name,
        role,
        isActive: true,
      },
    });

    revalidateMemberViews(projectId);
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "添加成员失败");
  }

  redirectWithFeedback(`/projects/${projectId}/members`, type, message);
}

async function updateMemberRole(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "成员角色已更新。";
  const projectId = String(formData.get("projectId") ?? "").trim();

  try {
    const memberId = String(formData.get("memberId") ?? "").trim();
    const role = normalizeMemberRole(formData.get("role"));

    if (!projectId || !memberId) {
      throw new Error("缺少项目或成员 ID。");
    }

    await prisma.member.update({
      where: {
        id: memberId,
        projectId,
      },
      data: {
        role,
      },
    });

    revalidateMemberViews(projectId);
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "更新成员角色失败");
  }

  redirectWithFeedback(`/projects/${projectId}/members`, type, message);
}

async function toggleMemberStatus(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "成员状态已更新。";
  const projectId = String(formData.get("projectId") ?? "").trim();

  try {
    const memberId = String(formData.get("memberId") ?? "").trim();
    const nextStatus = String(formData.get("isActive") ?? "") === "true";

    if (!projectId || !memberId) {
      throw new Error("缺少项目或成员 ID。");
    }

    await prisma.member.update({
      where: {
        id: memberId,
        projectId,
      },
      data: {
        isActive: nextStatus,
      },
    });

    revalidateMemberViews(projectId);
    message = nextStatus ? "成员已启用。" : "成员已停用。";
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "更新成员状态失败");
  }

  redirectWithFeedback(`/projects/${projectId}/members`, type, message);
}

async function deleteMember(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "成员已删除。";
  const projectId = String(formData.get("projectId") ?? "").trim();

  try {
    const memberId = String(formData.get("memberId") ?? "").trim();

    if (!projectId || !memberId) {
      throw new Error("缺少项目或成员 ID。");
    }

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        projectId,
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!member) {
      throw new Error("成员不存在或已被删除。");
    }

    if (member._count.submissions > 0) {
      throw new Error("该成员已有周报提交，不能删除；可停用成员以保留历史记录。");
    }

    await prisma.member.delete({
      where: {
        id: member.id,
      },
    });

    revalidateMemberViews(projectId);
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "删除成员失败");
  }

  redirectWithFeedback(`/projects/${projectId}/members`, type, message);
}

export default async function ProjectMembersPage({ params }: PageProps) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      members: {
        orderBy: [
          {
            role: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm font-semibold text-accent">成员维护</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal">成员</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          当前项目：{project.name}。成员角色只包含项目经理和开发。
        </p>
      </div>

      <Card>
        <h3 className="mb-5 text-xl font-semibold">新增成员</h3>
        <form action={addMember} className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <input name="projectId" type="hidden" value={project.id} />
          <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
            成员姓名
            <input
              className="h-11 rounded-md border border-line bg-white px-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              name="name"
              placeholder="例如：王五"
              required
              type="text"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
            角色
            <select
              className="h-11 rounded-md border border-line bg-white px-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              defaultValue="developer"
              name="role"
            >
              {memberRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-[#176447]"
            type="submit"
          >
            添加成员
          </button>
        </form>
      </Card>

      <Card>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold">当前成员</h3>
          <span className="text-sm text-ink-500">共 {project.members.length} 人</span>
        </div>

        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-paper text-ink-700">
              <tr>
                <th className="px-4 py-3 font-semibold">姓名</th>
                <th className="px-4 py-3 font-semibold">角色</th>
                <th className="px-4 py-3 font-semibold">状态</th>
                <th className="px-4 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {project.members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {member.name}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    <form action={updateMemberRole} className="flex gap-2">
                      <input name="projectId" type="hidden" value={project.id} />
                      <input name="memberId" type="hidden" value={member.id} />
                      <select
                        aria-label={`${member.name} 角色`}
                        className="h-9 rounded-md border border-line bg-white px-2 text-sm text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                        defaultValue={member.role}
                        name="role"
                      >
                        {memberRoleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button className="font-semibold text-accent hover:underline" type="submit">
                        保存
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {member.isActive ? "启用" : "停用"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <form action={toggleMemberStatus}>
                        <input name="projectId" type="hidden" value={project.id} />
                        <input name="memberId" type="hidden" value={member.id} />
                        <input
                          name="isActive"
                          type="hidden"
                          value={member.isActive ? "false" : "true"}
                        />
                        <button
                          className="font-semibold text-accent hover:underline"
                          type="submit"
                        >
                          {member.isActive ? "停用" : "启用"}
                        </button>
                      </form>
                      <form action={deleteMember}>
                        <input name="projectId" type="hidden" value={project.id} />
                        <input name="memberId" type="hidden" value={member.id} />
                        <ConfirmSubmitButton
                          className="font-semibold text-red-600 hover:underline"
                          confirmMessage={`确认删除成员「${member.name}」？已有周报提交的成员会被系统阻止删除。`}
                          type="submit"
                        >
                          删除
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {project.members.length === 0 ? (
          <p className="mt-4 text-sm text-ink-700">
            当前项目暂无成员。添加开发成员后，他们会出现在填写入口。
          </p>
        ) : null}
      </Card>
    </section>
  );
}
